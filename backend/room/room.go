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
	Name string `json:"name"`
	Description string `json:"description"`
	StartTime time.Time `json:"start_time"`
}

func CreateRoom(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	var req CreateRoomRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Description == "" || req.StartTime.IsZero() {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		http.Error(w, "Failed to get user id", http.StatusInternalServerError)
		return
	}
	// create room
	err = cfg.DB.CreateRoom(r.Context(), database.CreateRoomParams{
		ID: uuid.New(),
		Name: req.Name,
		Description: req.Description,
		OwnerID: userId,
		StartTime: req.StartTime,
	})
	if err != nil {
		http.Error(w, "Failed to create room", http.StatusInternalServerError)
		return
	}

	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room created successfully"})
}

func GetRoomByID(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	roomId := r.PathValue("room_id")
	if roomId == "" {
		http.Error(w, "Missing room id", http.StatusBadRequest)
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		http.Error(w, "Failed to parse room id", http.StatusBadRequest)
		return
	}
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		http.Error(w, "Failed to get room", http.StatusInternalServerError)
		return
	}
	lib.WriteJSON(w, http.StatusOK, room)
}

func GetRooms(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		http.Error(w, "Failed to get user id", http.StatusInternalServerError)
		return
	}
	rooms, err := cfg.DB.GetRoomsByOwnerID(r.Context(), userId)
	if err != nil {
		http.Error(w, "Failed to get rooms", http.StatusInternalServerError)
		return
	}
	lib.WriteJSON(w, http.StatusOK, rooms)
}

func DeleteRoom(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	roomId := r.PathValue("room_id")
	if roomId == "" {
		http.Error(w, "Missing room id", http.StatusBadRequest)
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		http.Error(w, "Failed to parse room id", http.StatusBadRequest)
		return
	}
	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		http.Error(w, "Failed to get user id", http.StatusInternalServerError)
		return
	}
	// check if user is the owner of the room
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		http.Error(w, "Failed to get room", http.StatusInternalServerError)
		return
	}
	if room.OwnerID != userId {
		http.Error(w, "You are not the owner of this room", http.StatusUnauthorized)
		return
	}
	err = cfg.DB.DeleteRoom(r.Context(), roomUUID)
	if err != nil {
		http.Error(w, "Failed to delete room", http.StatusInternalServerError)
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Room deleted successfully"})
}