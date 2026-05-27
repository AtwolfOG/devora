package room

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
	"github.com/google/uuid"
)

type CreateQuestionRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	IsCode      bool   `json:"is_code"`
	Code        string `json:"code"`
	Language    string `json:"language"`
}

func CreateQuestion(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	var req CreateQuestionRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}
	roomid := r.PathValue("room_id")
	if roomid == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing room id")
		return
	}

	// get user id from request context
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user id")
		return
	}
	// get room uuid
	roomUUID, err := uuid.Parse(roomid)
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
	// check if room status is pending
	if room.Status != database.RoomStatusPending {
		lib.WriteError(w, http.StatusBadRequest, "Room is not pending")
		return
	}
	// validate question
	if req.Title == "" || req.Description == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing required fields")
		return
	}
	queries, tx, err := cfg.NewTx(r.Context())
	defer tx.Rollback()
	questionID, err := queries.CreateQuestion(r.Context(), database.CreateQuestionParams{
		RoomID:      roomUUID,
		Title:       req.Title,
		Description: req.Description,
		IsCode:      req.IsCode,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to create question")
		return
	}
	//
	if req.IsCode {
		if req.Language == "" {
			lib.WriteError(w, http.StatusBadRequest, "Missing required fields")
			return
		}
		var lang database.Language
		var extension string
		switch strings.ToLower(req.Language) {
		case "go":
			extension = ".go"
			lang = database.LanguageGo
		case "python":
			extension = ".py"
			lang = database.LanguagePython
		case "javascript":
			extension = ".js"
			lang = database.LanguageJavascript
		default:
			lib.WriteError(w, http.StatusBadRequest, "Invalid language")
			return
		}
		err = queries.CreateCode(r.Context(), database.CreateCodeParams{
			Name:       "main" + extension,
			QuestionID: questionID,
			Code:       req.Code,
			Language:   lang,
		})
		if err != nil {
			lib.WriteError(w, http.StatusInternalServerError, "Failed to create question code")
			return
		}
	}
	if err = tx.Commit(); err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to create question")
		return
	}
	lib.WriteJSON(w, http.StatusCreated, map[string]string{"message": "Question created successfully"})
}

func GetRoomQuestions(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusUnauthorized, "You are not authorized to perform this action")
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
	// check if user is owner or participant
	if room.OwnerID != userId && (!room.ParticipantID.Valid || room.ParticipantID.UUID != userId) {
		lib.WriteError(w, http.StatusUnauthorized, "You are not authorized to perform this action")
		return
	}
	// check if room is pending and participant has not joined the room
	if (room.Status == database.RoomStatusPending || room.Status == database.RoomStatusCancelled) && room.OwnerID != userId {
		var data struct {
			Questions []database.Question `json:"questions"`
			IsOwner   bool                `json:"is_owner"`
		}
		data.Questions = []database.Question{}
		data.IsOwner = (room.OwnerID == userId)
		lib.WriteJSON(w, http.StatusOK, data)
		return
	}
	questions, err := cfg.DB.GetQuestionsByRoomID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get questions")
		return
	}
	var data struct {
		Questions []database.Question `json:"questions"`
		IsOwner   bool                `json:"is_owner"`
	}
	if questions == nil {
		data.Questions = []database.Question{}
	} else {
		data.Questions = questions
	}
	data.IsOwner = (room.OwnerID == userId)
	lib.WriteJSON(w, http.StatusOK, data)
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

func PassQuestion(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
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
	err = cfg.DB.PassQuestion(r.Context(), database.PassQuestionParams{
		ID:     int32(questionIdInt),
		RoomID: roomUUID,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to pass question")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Question passed successfully"})
}

func FailQuestion(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
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
	err = cfg.DB.FailQuestion(r.Context(), database.FailQuestionParams{
		ID:     int32(questionIdInt),
		RoomID: roomUUID,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to fail question")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Question failed successfully"})
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
