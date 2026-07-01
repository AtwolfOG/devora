package user

import (
	"fmt"
	"net/http"
	"time"

	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
	"github.com/google/uuid"
)

// GetDashboardStat godoc
//
// @Summary Get dashboard statistics
// @Description Returns stats like total interview count, upcoming count, completed count and pass rate for the current user.
// @ID getDashboardStat
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} UserDashboardStats
// @Failure 400 {object} lib.ErrorResponse
// @Failure 500 {object} lib.ErrorResponse
// @Router /api/users/dashboard [get]
func GetDashboardStat(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
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
		UUID:  userId,
		Valid: true,
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get pass rate")
		return
	}
	fmt.Println("pass rate", passRate)

	lib.WriteJSON(w, http.StatusOK, map[string]any{
		"total_interview_count":     totalRoomCount,
		"upcoming_interview_count":  upcomingRoomCount,
		"completed_interview_count": completedRoomCount,
		"username":                  user.Name,
		"user_image":                user.ProfilePictureUrl,
		"pass_rate":                 passRate,
	})
}

// GetUserData godoc
//
// @Summary Get current user profile
// @Description Returns the profile username, email, and picture URL for the authenticated user.
// @ID getUserData
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} UserProfileResponse
// @Failure 400 {object} lib.ErrorResponse
// @Failure 500 {object} lib.ErrorResponse
// @Router /api/users/profile [get]
func GetUserData(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
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
		"username":            user.Name,
		"email":               user.Email,
		"profile_picture_url": user.ProfilePictureUrl,
	})
}

// GetUser godoc
//
// @Summary Get user by ID
// @Description Returns public profile details of a user by UUID.
// @ID getUser
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Param user_id path string true "User ID"
// @Success 200 {object} UserProfileResponse
// @Failure 400 {object} lib.ErrorResponse
// @Failure 500 {object} lib.ErrorResponse
// @Router /api/users/{user_id} [get]
func GetUser(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
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
		"username":            user.Name,
		"profile_picture_url": user.ProfilePictureUrl,
		"email":               user.Email,
	})
}

// GetSettings godoc
//
// @Summary Get user OAuth settings
// @Description Returns OAuth configuration statuses for the authenticated user.
// @ID getSettings
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]UserOauthSetting
// @Failure 400 {object} lib.ErrorResponse
// @Failure 500 {object} lib.ErrorResponse
// @Router /api/users/settings [get]
func GetSettings(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	userId, err := auth.GetIdFromReqCtx(r)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to get user")
		return
	}

	userOauthProviders, err := cfg.DB.GetOauthProvidersByUserId(r.Context(), userId)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}

	type oauthProviders struct {
		CreatedAt time.Time `json:"created_at"`
		Provider  string    `json:"provider"`
		UpdatedAt time.Time `json:"updated_at"`
	}
	var oauthProvidersMap = make(map[string]oauthProviders)
	for _, oauthProvider := range userOauthProviders {
		oauthProvidersMap[string(oauthProvider.Provider)] = oauthProviders{
			CreatedAt: oauthProvider.CreatedAt,
			Provider:  string(oauthProvider.Provider),
			UpdatedAt: oauthProvider.UpdatedAt,
		}
	}

	lib.WriteJSON(w, http.StatusOK, oauthProvidersMap)
}
