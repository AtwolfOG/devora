package user

import (
	"fmt"
	"net/http"

	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
	"github.com/google/uuid"
)


func GetDashboardStat(w http.ResponseWriter, r *http.Request, cfg *config.Config){
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to get user")
		return
	}

	user, err := cfg.DB.GetUserById(r.Context(), userId)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}

	totalRoomCount, err := cfg.DB.GetRoomCountByStatus(r.Context(), database.GetRoomCountByStatusParams{
		OwnerID: userId,
		Column2: []database.RoomStatus{
			database.RoomStatusPending,
			database.RoomStatusLive,
			database.RoomStatusReviewing,
			database.RoomStatusCompleted,
		},
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room count")
		return
	}

	upcomingRoomCount, err := cfg.DB.GetRoomCountByStatus(r.Context(), database.GetRoomCountByStatusParams{
		OwnerID: userId,
		Column2: []database.RoomStatus{
			database.RoomStatusPending,
		},
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get upcoming room count")
		return
	}

	completedRoomCount, err := cfg.DB.GetRoomCountByStatus(r.Context(), database.GetRoomCountByStatusParams{
		OwnerID: userId,
		Column2: []database.RoomStatus{
			database.RoomStatusCompleted,
		},
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get completed room count")
		return
	}

	passRate, err := cfg.DB.GetPassRate(r.Context(), uuid.NullUUID{
		UUID: userId,
		Valid: true,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get pass rate")
		return
	}
	fmt.Println("pass rate", passRate)

	lib.WriteJSON(w, http.StatusOK, map[string]any{
		"total_interview_count":    totalRoomCount,
		"upcoming_interview_count": upcomingRoomCount,
		"completed_interview_count": completedRoomCount,
		"username": user.Name,
		"user_image": user.ProfilePictureUrl,
		"pass_rate": passRate,
	})
}

func GetUserData(w http.ResponseWriter, r *http.Request, cfg *config.Config){
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to get user")
		return
	}

	user, err := cfg.DB.GetUserById(r.Context(), userId)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}

	lib.WriteJSON(w, http.StatusOK, map[string]any{
		"name": user.Name,
		"email": user.Email,
		"profile_picture_url": user.ProfilePictureUrl,
	})
}

func GetUser(w http.ResponseWriter, r *http.Request, cfg *config.Config){
	userIdParam := r.PathValue("user_id")
	if userIdParam == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing user id")
		return
	}
	userId, err := uuid.Parse(userIdParam)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse user id")
		return
	}

	user, err := cfg.DB.GetUserById(r.Context(), userId)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}


	lib.WriteJSON(w, http.StatusOK, map[string]any{
		"username": user.Name,
		"user_image": user.ProfilePictureUrl,
		"email": user.Email,
	})
}