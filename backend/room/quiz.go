package room

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
	"github.com/google/uuid"
)

type question struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	IsCode      bool   `json:"is_code"`
}
type CreateQuestionsRequest struct {
	RoomID    string     `json:"room_id"`
	Questions []question `json:"questions"`
}

func CreateQuestions(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	var req CreateQuestionsRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		http.Error(w, "Failed to get user id", http.StatusInternalServerError)
		return
	}
	// get room uuid
	roomUUID, err := uuid.Parse(req.RoomID)
	if err != nil {
		http.Error(w, "Failed to parse room id", http.StatusBadRequest)
		return
	}
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		http.Error(w, "Failed to get room", http.StatusInternalServerError)
		return
	}
	// check if user is the owner of the room
	if room.OwnerID != userId {
		http.Error(w, "You are not the owner of this room", http.StatusUnauthorized)
		return
	}
	// check if room is active
	if !room.IsActive {
		http.Error(w, "Room is not active", http.StatusBadRequest)
		return
	}
	for _, question := range req.Questions {
		err = cfg.DB.CreateQuestion(r.Context(), database.CreateQuestionParams{
			RoomID:      roomUUID,
			Title:       question.Title,
			Description: question.Description,
			IsCode:      question.IsCode,
		})
		if err != nil {
			http.Error(w, "Failed to create question", http.StatusInternalServerError)
			return
		}
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Questions created successfully"})
}

func GetRoomQuestions(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
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
	questions, err := cfg.DB.GetQuestionsByRoomID(r.Context(), roomUUID)
	if err != nil {
		http.Error(w, "Failed to get questions", http.StatusInternalServerError)
		return
	}
	lib.WriteJSON(w, http.StatusOK, questions)
}

func GetRoomQuestionByID(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	questionId := r.PathValue("question_id")
	roomId := r.PathValue("room_id")
	if questionId == "" || roomId == "" {
		http.Error(w, "Missing question id or room id", http.StatusBadRequest)
		return
	}
	questionIdInt, err := strconv.ParseInt(questionId, 10, 32)
	if err != nil {
		http.Error(w, "Failed to parse question id", http.StatusBadRequest)
		return
	}
	if questionIdInt <= 0 {
		http.Error(w, "Invalid question id", http.StatusBadRequest)
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		http.Error(w, "Failed to parse room id", http.StatusBadRequest)
		return
	}
	question, err := cfg.DB.GetQuestionByID(r.Context(), database.GetQuestionByIDParams{
		ID:     int32(questionIdInt),
		RoomID: roomUUID,
	})
	if err != nil {
		http.Error(w, "Failed to get question", http.StatusInternalServerError)
		return
	}
	lib.WriteJSON(w, http.StatusOK, question)
}

func DeleteQuestion(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	questionId := r.PathValue("question_id")
	roomId := r.PathValue("room_id")
	if questionId == "" || roomId == "" {
		http.Error(w, "Missing question id or room id", http.StatusBadRequest)
		return
	}
	questionIdInt, err := strconv.ParseInt(questionId, 10, 32)
	if err != nil {
		http.Error(w, "Failed to parse question id", http.StatusBadRequest)
		return
	}
	if questionIdInt <= 0 {
		http.Error(w, "Invalid question id", http.StatusBadRequest)
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

	err = cfg.DB.DeleteQuestion(r.Context(), database.DeleteQuestionParams{
		ID:     int32(questionIdInt),
		RoomID: roomUUID,
	})
	if err != nil {
		http.Error(w, "Failed to delete question", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
