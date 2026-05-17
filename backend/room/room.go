package room

import (
	"encoding/json"
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
	Role        string    `json:"role"`
	Company     string    `json:"company"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"start_time"`
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

	if req.Role == "" || req.Description == "" || req.Company == "" || req.StartTime.IsZero() {
		lib.WriteError(w, http.StatusBadRequest, "Missing required fields")
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
		StartTime:   req.StartTime,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to create room")
		return
	}

	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room created successfully"})
}

func GetRoomByID(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
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
	lib.WriteJSON(w, http.StatusOK, room)
}

func GetRooms(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	rooms, err := cfg.DB.GetRoomsByOwnerID(r.Context(), userId)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get rooms")
		return
	}
	lib.WriteJSON(w, http.StatusOK, rooms)
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
	err = cfg.DB.DeleteRoom(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to delete room")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room deleted successfully"})
}

func JoinRoom(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
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
	// check if user is already a member of the room
	
	// join room
	err = cfg.DB.JoinRoom(r.Context(), database.JoinRoomParams{
		ID: roomUUID,
		ParticipantID: uuid.NullUUID{UUID:userId, Valid:true},
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to join room")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room joined successfully"})
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

	if req.Role == "" || req.Description == "" || req.Company == "" || req.StartTime.After(time.Now()) {
		lib.WriteError(w, http.StatusBadRequest, "Missing required fields")
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
		Role:        req.Role,
		Company:     req.Company,
		Description: req.Description,
		StartTime:   req.StartTime,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to update room")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room updated successfully"})
}
