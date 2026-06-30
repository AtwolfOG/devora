package room

import (
	"database/sql"
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

// SubmitAnswer godoc
//
// @Summary Submit an answer for a question
// @Tags Answers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Param question_id path integer true "Question ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id}/questions/{question_id}/answer [post]
func SubmitAnswer(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	questionIdParam := r.PathValue("question_id")
	if questionIdParam == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing question id")
		return
	}
	questionId, err := strconv.Atoi(questionIdParam)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Invalid question id")
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
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to get user")
		return
	}
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	if userId != room.ParticipantID.UUID {
		lib.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	var data struct {
		Answer string `json:"answer"`
	}
	err = json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Invalid request")
		return
	}
	if data.Answer == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing answer")
		return
	}
	dbQueries, tx, err := cfg.NewTx(r.Context())
	defer tx.Rollback()
	err = dbQueries.DoneQuestion(r.Context(), database.DoneQuestionParams{
		ID:     int32(questionId),
		RoomID: roomUUID,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to mark question as done")
		return
	}
	err = dbQueries.CreateAnswer(r.Context(), database.CreateAnswerParams{
		QuestionID: int32(questionId),
		RoomID:     roomUUID,
		Answer:     data.Answer,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to save answer")
		return
	}
	if err = tx.Commit(); err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to save answer")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Answer saved successfully"})
}

// SubmitCode godoc
//
// @Summary Submit code for a question
// @Tags Answers
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Param question_id path integer true "Question ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id}/questions/{question_id}/code [post]
func SubmitCode(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	questionIdParam := r.PathValue("question_id")
	if questionIdParam == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing question id")
		return
	}
	questionId, err := strconv.Atoi(questionIdParam)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Invalid question id")
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

	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to get user")
		return
	}
	room, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	if userId != room.ParticipantID.UUID {
		lib.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	var data struct {
		Code     string `json:"code"`
		Language string `json:"language"`
	}
	err = json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Invalid request")
		return
	}
	if data.Code == "" || data.Language == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing required fields")
		return
	}
	var lang database.Language
	var extension string
	switch strings.ToLower(data.Language) {
	case "go":
		lang = database.LanguageGo
		extension = ".go"
	case "python":
		lang = database.LanguagePython
		extension = ".py"
	case "javascript":
		lang = database.LanguageJavascript
		extension = ".js"
	default:
		lib.WriteError(w, http.StatusBadRequest, "Invalid language")
		return
	}
	dbQueries, tx, err := cfg.NewTx(r.Context())
	defer tx.Rollback()
	err = dbQueries.DoneQuestion(r.Context(), database.DoneQuestionParams{
		ID:     int32(questionId),
		RoomID: roomUUID,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to mark question as done")
		return
	}
	err = dbQueries.CreateCode(r.Context(), database.CreateCodeParams{
		Name:       "main" + extension,
		QuestionID: int32(questionId),
		RoomID:     roomUUID,
		Code:       data.Code,
		Language:   lang,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to save code")
		return
	}
	if err = tx.Commit(); err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to save code")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Code saved successfully"})
}

// GetAnswer godoc
//
// @Summary Get answer for a question
// @Tags Answers
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Param question_id path integer true "Question ID"
// @Success 200 {object} database.Answer
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id}/questions/{question_id}/answer [get]
func GetAnswer(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	questionIdParam := r.PathValue("question_id")
	if questionIdParam == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing question id")
		return
	}
	questionId, err := strconv.Atoi(questionIdParam)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Invalid question id")
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
	answer, err := cfg.DB.GetAnswerByQuestionAndRoomID(r.Context(), database.GetAnswerByQuestionAndRoomIDParams{
		QuestionID: int32(questionId),
		RoomID:     roomUUID,
	})
	if err == sql.ErrNoRows {
		return
	}
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get answer")
		return
	}
	lib.WriteJSON(w, http.StatusOK, answer)
}

// GetCode godoc
//
// @Summary Get code for a question
// @Tags Answers
// @Produce json
// @Security BearerAuth
// @Param room_id path string true "Room ID"
// @Param question_id path integer true "Question ID"
// @Success 200 {object} database.CodeSnippet
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id}/questions/{question_id}/code [get]
func GetCode(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	questionIdParam := r.PathValue("question_id")
	if questionIdParam == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing question id")
		return
	}
	questionId, err := strconv.Atoi(questionIdParam)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Invalid question id")
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

	code, err := cfg.DB.GetCodeByQuestionAndRoomIDAndName(r.Context(), database.GetCodeByQuestionAndRoomIDAndNameParams{
		QuestionID: int32(questionId),
		RoomID:     roomUUID,
		Name:       "main",
	})
	// no row error should never happen here because a code snippet is always created when the question is created
	// if err == sql.ErrNoRows{
	// 	return
	// }
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get code")
		return
	}

	lib.WriteJSON(w, http.StatusOK, code)
}
