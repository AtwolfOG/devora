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
		lib.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	// get room uuid
	roomUUID, err := uuid.Parse(req.RoomID)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	// check if user is the owner of the room
	if room.OwnerID != userId {
		lib.WriteError(w, http.StatusUnauthorized, "You are not the owner of this room")
		return
	}
	// check if room is active
	if !room.IsActive {
		lib.WriteError(w, http.StatusBadRequest, "Room is not active")
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
			lib.WriteError(w, http.StatusInternalServerError, "Failed to create question")
			return
		}
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Questions created successfully"})
}

func GetRoomQuestions(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
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
	questions, err := cfg.DB.GetQuestionsByRoomID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get questions")
		return
	}
	lib.WriteJSON(w, http.StatusOK, questions)
}

func GetRoomQuestionByID(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	questionId := r.PathValue("question_id")
	roomId := r.PathValue("room_id")
	if questionId == "" || roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing question id or room id")
		return
	}
	questionIdInt, err := strconv.ParseInt(questionId, 10, 32)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse question id")
		return
	}
	if questionIdInt <= 0 {
		lib.WriteError(w, http.StatusBadRequest, "Invalid question id")
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	question, err := cfg.DB.GetQuestionByID(r.Context(), database.GetQuestionByIDParams{
		ID:     int32(questionIdInt),
		RoomID: roomUUID,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get question")
		return
	}
	lib.WriteJSON(w, http.StatusOK, question)
}

func DeleteQuestion(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	questionId := r.PathValue("question_id")
	roomId := r.PathValue("room_id")
	if questionId == "" || roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing question id or room id")
		return
	}
	questionIdInt, err := strconv.ParseInt(questionId, 10, 32)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse question id")
		return
	}
	if questionIdInt <= 0 {
		lib.WriteError(w, http.StatusBadRequest, "Invalid question id")
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

	err = cfg.DB.DeleteQuestion(r.Context(), database.DeleteQuestionParams{
		ID:     int32(questionIdInt),
		RoomID: roomUUID,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to delete question")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Question deleted successfully"})
}
