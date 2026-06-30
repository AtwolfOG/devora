package room

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
	"github.com/google/uuid"
)

type CreateRoomRequest struct {
	Role        string `json:"role"`
	Company     string `json:"company"`
	Description string `json:"description"`
	StartTime   string `json:"start_time"`
}

// CreateRoom godoc
//
// @Summary Create a new room
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body CreateRoomRequest true "Create room request body"
// @Success 201 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms [post]
func CreateRoom(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	var req CreateRoomRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	req.Role = strings.TrimSpace(req.Role)
	req.Description = strings.TrimSpace(req.Description)
	req.Company = strings.TrimSpace(req.Company)

	// parse start_time
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse start_time")
		return
	}

	if req.Role == "" || req.Description == "" || req.Company == "" || req.StartTime == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	if startTime.IsZero() || startTime.Before(time.Now()) {
		lib.WriteError(w, http.StatusBadRequest, "Invalid start time")
		return
	}

	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	// create room
	err = cfg.DB.CreateRoom(r.Context(), database.CreateRoomParams{
		Role:        req.Role,
		Company:     req.Company,
		Description: req.Description,
		OwnerID:     userId,
		StartTime:   startTime,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to create room")
		return
	}

	lib.WriteJSON(w, http.StatusCreated, map[string]string{"message": "Room created successfully"})
}

// GetRoomByID godoc
//
// @Summary Get room by ID
// @Tags Rooms
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Success 200 {object} RoomDetailsResponseDTO
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id} [get]
func GetRoomByID(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	roomId := r.PathValue("room_id")
	if roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing room id")
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	var data struct {
		database.Room
		IsOwner       bool `json:"is_owner"`
		IsParticipant bool `json:"is_participant"`
	}
	data.Room = room
	data.IsOwner = (room.OwnerID == userId)
	if room.ParticipantID.Valid && room.ParticipantID.UUID == userId {
		data.IsParticipant = true
	} else {
		data.IsParticipant = false
	}
	lib.WriteJSON(w, http.StatusOK, data)
}

// GetRooms godoc
//
// @Summary Get rooms for current user
// @Tags Rooms
// @Produce json
// @Security BearerAuth
// @Param status query string false "Comma-separated room statuses (pending,live,reviewing,completed,cancelled)"
// @Param limit query integer false "Limit number of results"
// @Param offset query integer false "Offset for pagination"
// @Param type query string false "Filter by type (owner, participant)"
// @Success 200 {array} RoomDTO
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms [get]
func GetRooms(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	queryStatus := r.URL.Query().Get("status")
	var status []database.RoomStatus
	for _, s := range strings.Split(queryStatus, ",") {
		switch s {
		case "pending":
			status = append(status, database.RoomStatusPending)
		case "live":
			status = append(status, database.RoomStatusLive)
		case "reviewing":
			status = append(status, database.RoomStatusReviewing)
		case "completed":
			status = append(status, database.RoomStatusCompleted)
		case "cancelled":
			status = append(status, database.RoomStatusCancelled)
		}
	}
	queryLimit := r.URL.Query().Get("limit")
	var limit int32
	if queryLimit == "" {
		limit = 999
	} else {
		var err error
		tmp, err := strconv.Atoi(queryLimit)
		if err != nil {
			lib.WriteError(w, http.StatusBadRequest, "Failed to parse limit")
			return
		}
		limit = int32(tmp)
	}
	queryOffset := r.URL.Query().Get("offset")
	var offset int32
	if queryOffset == "" {
		offset = 0
	} else {
		var err error
		tmp, err := strconv.Atoi(queryOffset)
		if err != nil {
			lib.WriteError(w, http.StatusBadRequest, "Failed to parse offset")
			return
		}
		offset = int32(tmp)
	}
	queryType := r.URL.Query().Get("type")
	switch queryType {
	case "":
		if len(status) == 0 {
			rooms, err := cfg.DB.GetRoomsByOwnerIDOrParticipantID(r.Context(), database.GetRoomsByOwnerIDOrParticipantIDParams{
				OwnerID: userId,
				Limit:   limit,
				Offset:  offset,
			})
			if err != nil {
				lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
				return
			}
			// add is_owner and is_participant to the response
			var data []struct {
				database.Room
				IsOwner       bool `json:"is_owner"`
				IsParticipant bool `json:"is_participant"`
			}
			for _, room := range rooms {
				data = append(data, struct {
					database.Room
					IsOwner       bool `json:"is_owner"`
					IsParticipant bool `json:"is_participant"`
				}{
					Room:          room,
					IsOwner:       room.OwnerID == userId,
					IsParticipant: room.OwnerID != userId,
				})
			}
			lib.WriteJSON(w, http.StatusOK, data)
			return
		}
		rooms, err := cfg.DB.GetRoomsByOwnerIDOrParticipantIDAndStatus(r.Context(), database.GetRoomsByOwnerIDOrParticipantIDAndStatusParams{
			OwnerID: userId,
			Limit:   limit,
			Offset:  offset,
			Column2: status,
		})
		if err != nil {
			lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
			return
		}
		// add is_owner and is_participant to the response
		var data []struct {
			database.Room
			IsOwner       bool `json:"is_owner"`
			IsParticipant bool `json:"is_participant"`
		}
		for _, room := range rooms {
			data = append(data, struct {
				database.Room
				IsOwner       bool `json:"is_owner"`
				IsParticipant bool `json:"is_participant"`
			}{
				Room:          room,
				IsOwner:       room.OwnerID == userId,
				IsParticipant: room.OwnerID != userId,
			})
		}
		lib.WriteJSON(w, http.StatusOK, data)
		return
	case "owner":
		if len(status) == 0 {
			rooms, err := cfg.DB.GetRoomsByOwnerID(r.Context(), database.GetRoomsByOwnerIDParams{
				OwnerID: userId,
				Limit:   limit,
				Offset:  offset,
			})
			if err != nil {
				lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
				return
			}
			lib.WriteJSON(w, http.StatusOK, rooms)
			return
		}
		rooms, err := cfg.DB.GetRoomsByOwnerIDAndStatus(r.Context(), database.GetRoomsByOwnerIDAndStatusParams{
			OwnerID: userId,
			Limit:   limit,
			Offset:  offset,
			Column2: status,
		})
		if err != nil {
			lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
			return
		}
		lib.WriteJSON(w, http.StatusOK, rooms)
		return
	case "participant":
		if len(status) == 0 {
			rooms, err := cfg.DB.GetRoomsByParticipantID(r.Context(), database.GetRoomsByParticipantIDParams{
				ParticipantID: uuid.NullUUID{UUID: userId, Valid: true},
				Limit:         limit,
				Offset:        offset,
			})
			if err != nil {
				lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
				return
			}
			lib.WriteJSON(w, http.StatusOK, rooms)
			return
		}
		rooms, err := cfg.DB.GetRoomsByParticipantIDAndStatus(r.Context(), database.GetRoomsByParticipantIDAndStatusParams{
			ParticipantID: uuid.NullUUID{UUID: userId, Valid: true},
			Limit:         limit,
			Offset:        offset,
			Column2:       status,
		})
		if err != nil {
			lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
			return
		}
		lib.WriteJSON(w, http.StatusOK, rooms)
		return
	default:
		lib.WriteError(w, http.StatusBadRequest, "Invalid type")
		return
	}
}

// DeleteRoom godoc
//
// @Summary Delete a room
// @Tags Rooms
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id} [delete]
func DeleteRoom(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	roomId := r.PathValue("room_id")
	if roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing room id")
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	// check if user is the owner of the room
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	if room.OwnerID != userId {
		lib.WriteError(w, http.StatusUnauthorized, "You are not the owner of this room")
		return
	}
	err = cfg.DB.DeleteRoom(r.Context(), database.DeleteRoomParams{
		ID:      roomUUID,
		OwnerID: userId,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to delete room")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room deleted successfully"})
}

// AddParticipantToRoom godoc
//
// @Summary Join a room as participant
// @Tags Rooms
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id}/join [patch]
func AddParticipantToRoom(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	roomId := r.PathValue("room_id")
	if roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing room id")
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	dbqueries, tx, err := cfg.NewTx(r.Context())
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to start transaction")
		return
	}
	defer tx.Rollback()
	// check if user is already a member of the room
	room, err := dbqueries.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	if room.OwnerID == userId {
		lib.WriteError(w, http.StatusUnauthorized, "You are the owner of this room")
		return
	}

	if room.ParticipantID.Valid {
		lib.WriteError(w, http.StatusUnauthorized, "You are already a participant of this room")
		return
	}
	// join room
	err = dbqueries.AddParticipantToRoom(r.Context(), database.AddParticipantToRoomParams{
		ID:            roomUUID,
		ParticipantID: uuid.NullUUID{UUID: userId, Valid: true},
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to join room")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room joined successfully"})
}

// RemoveParticipantFromRoom godoc
//
// @Summary Leave a room or remove participant
// @Tags Rooms
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id}/leave [patch]
func RemoveParticipantFromRoom(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	roomId := r.PathValue("room_id")
	if roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing room id")
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	if !room.ParticipantID.Valid {
		lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Participant removed from room successfully"})
		return
	}
	// check if it is owner or participant
	if room.OwnerID != userId && room.ParticipantID.UUID != userId {
		lib.WriteError(w, http.StatusUnauthorized, "You are not the owner or participant of this room")
		return
	}
	// remove participant from room
	err = cfg.DB.RemoveParticipantFromRoom(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to remove participant from room")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Participant removed from room successfully"})
}

// UpdateRoom godoc
//
// @Summary Update a room
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Param request body CreateRoomRequest true "Update room request body"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id} [put]
func UpdateRoom(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	roomId := r.PathValue("room_id")
	if roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing room id")
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	var req CreateRoomRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// validate request
	req.Role = strings.TrimSpace(req.Role)
	req.Description = strings.TrimSpace(req.Description)
	req.Company = strings.TrimSpace(req.Company)

	// parse start_time
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse start_time")
		return
	}

	if req.Role == "" || req.Description == "" || req.Company == "" || req.StartTime == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing required fields")
		return
	}
	if startTime.IsZero() || startTime.Before(time.Now()) {
		lib.WriteError(w, http.StatusBadRequest, "Invalid start time")
		return
	}
	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	// check if user is the owner of the room
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	if room.OwnerID != userId {
		lib.WriteError(w, http.StatusUnauthorized, "You are not the owner of this room")
		return
	}
	err = cfg.DB.UpdateRoom(r.Context(), database.UpdateRoomParams{
		ID:          roomUUID,
		OwnerID:     userId,
		Role:        req.Role,
		Company:     req.Company,
		Description: req.Description,
		StartTime:   startTime,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to update room")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room updated successfully"})
}

// CancelRoom godoc
//
// @Summary Cancel a room
// @Tags Rooms
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id}/cancel [patch]
func CancelRoom(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	roomId := r.PathValue("room_id")
	if roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing room id")
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	// check if user is the owner of the room
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	if room.OwnerID != userId {
		lib.WriteError(w, http.StatusUnauthorized, "You are not the owner of this room")
		return
	}
	err = cfg.DB.CancelRoom(r.Context(), database.CancelRoomParams{
		ID:      roomUUID,
		OwnerID: userId,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to cancel room")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room cancelled successfully"})
}

// RescheduleRoom godoc
//
// @Summary Reschedule a cancelled room
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id}/reschedule [patch]
func RescheduleRoom(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	roomId := r.PathValue("room_id")
	if roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing room id")
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	// check if user is the owner of the room
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	if room.OwnerID != userId {
		lib.WriteError(w, http.StatusUnauthorized, "You are not the owner of this room")
		return
	}
	if room.Status != database.RoomStatusCancelled {
		lib.WriteError(w, http.StatusBadRequest, "Room is not pending")
		return
	}
	var req struct {
		StartTime string `json:"start_time"`
	}
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse request")
		return
	}
	if req.StartTime == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing start time")
		return
	}
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse start time")
		return
	}
	if startTime.IsZero() || startTime.Before(time.Now()) {
		lib.WriteError(w, http.StatusBadRequest, "Invalid start time")
		return
	}
	err = cfg.DB.RescheduleRoom(r.Context(), database.RescheduleRoomParams{
		ID:        roomUUID,
		OwnerID:   userId,
		StartTime: startTime,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to reschedule room")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room rescheduled successfully"})
}

// SubmitFeedback godoc
//
// @Summary Submit feedback for a room
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id}/submit-feedback [patch]
func SubmitFeedback(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	roomId := r.PathValue("room_id")
	if roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing room id")
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	if room.OwnerID != userId {
		lib.WriteError(w, http.StatusUnauthorized, "You are not the owner of this room")
		return
	}
	if room.Status != database.RoomStatusReviewing {
		lib.WriteError(w, http.StatusBadRequest, "Room is not reviewing")
		return
	}
	var req struct {
		Feedback string `json:"feedback"`
		Passed   bool   `json:"passed"`
	}
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse request")
		return
	}
	feedback := sql.NullString{
		String: req.Feedback,
		Valid:  req.Feedback != "",
	}
	err = cfg.DB.SubmitFeedback(r.Context(), database.SubmitFeedbackParams{
		ID:       roomUUID,
		OwnerID:  userId,
		Feedback: feedback,
		Passed: sql.NullBool{
			Bool:  req.Passed,
			Valid: true,
		},
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to submit feedback")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Feedback submitted successfully"})
}
