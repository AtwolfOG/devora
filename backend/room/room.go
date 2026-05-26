package room

import (
	"encoding/json"
	"fmt"
	"net/http"
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

	if req.Role == "" || req.Description == "" || req.Company == "" || req.StartTime == ""  {
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
	var data struct{
		database.Room
		IsOwner bool `json:"is_owner"`
		IsParticipant bool `json:"is_participant"`
	}
	data.Room = room
	data.IsOwner = (room.OwnerID == userId)
	if room.ParticipantID.Valid && room.ParticipantID.UUID == userId {
		data.IsParticipant = true
	}else{
		data.IsParticipant = false
	}
	lib.WriteJSON(w, http.StatusOK, data)
}

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
	queryType := r.URL.Query().Get("type")
	switch queryType {
		case "":
		fmt.Println("status: ", status)
		if len(status) == 0 {
			rooms, err := cfg.DB.GetRoomsByOwnerIDOrParticipantID(r.Context(), userId)
			if err != nil {
				lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
				return
			}
			// add is_owner and is_participant to the response
			var data []struct{
				database.Room
				IsOwner bool `json:"is_owner"`
				IsParticipant bool `json:"is_participant"`
			}
			for _, room := range rooms {
				data = append(data, struct{
					database.Room
					IsOwner bool `json:"is_owner"`
					IsParticipant bool `json:"is_participant"`
				}{
					Room:        room,
					IsOwner:     room.OwnerID == userId,
					IsParticipant: room.OwnerID != userId,
				})
			}
			lib.WriteJSON(w, http.StatusOK, data)
			return
		}
		rooms, err := cfg.DB.GetRoomsByOwnerIDOrParticipantIDAndStatus(r.Context(), database.GetRoomsByOwnerIDOrParticipantIDAndStatusParams{
			OwnerID: userId,
			Column2: status,
		})
		if err != nil {
			lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
			return
		}
		// add is_owner and is_participant to the response
			var data []struct{
				database.Room
				IsOwner bool `json:"is_owner"`
				IsParticipant bool `json:"is_participant"`
			}
			for _, room := range rooms {
				data = append(data, struct{
					database.Room
					IsOwner bool `json:"is_owner"`
					IsParticipant bool `json:"is_participant"`
				}{
					Room:        room,
					IsOwner:     room.OwnerID == userId,
					IsParticipant: room.OwnerID != userId,
				})
			}
			lib.WriteJSON(w, http.StatusOK, data)
		return
		case "owner":
		if len(status) == 0 {
			rooms, err := cfg.DB.GetRoomsByOwnerID(r.Context(), userId)
			if err != nil {
				lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
				return
			}
			lib.WriteJSON(w, http.StatusOK, rooms)
			return
		}
		rooms, err := cfg.DB.GetRoomsByOwnerIDAndStatus(r.Context(), database.GetRoomsByOwnerIDAndStatusParams{
			OwnerID: userId,
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
			rooms, err := cfg.DB.GetRoomsByParticipantID(r.Context(), uuid.NullUUID{UUID: userId, Valid: true})
			if err != nil {
				lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
				return
			}
			lib.WriteJSON(w, http.StatusOK, rooms)
			return
		}
		rooms, err := cfg.DB.GetRoomsByParticipantIDAndStatus(r.Context(), database.GetRoomsByParticipantIDAndStatusParams{
			ParticipantID: uuid.NullUUID{UUID: userId, Valid: true},
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
	var req struct{
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