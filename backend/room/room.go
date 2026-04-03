package room

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
	"github.com/google/uuid"
)

type CreateRoomRequest struct {
	Name        string    `json:"name"`
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

	if req.Name == "" || req.Description == "" || req.StartTime.IsZero() {
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
		ID:          uuid.New(),
		Name:        req.Name,
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
