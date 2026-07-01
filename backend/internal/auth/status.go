package auth

import (
	"net/http"
	"time"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/lib"
)

// StatusResponse represents the authentication status response
type StatusResponse struct {
	LoggedIn bool `json:"loggedIn"`
}

// Status godoc
//
// @Summary Check authentication status
// @Description Checks if the user is authenticated by verifying their refresh token cookie.
// @ID authStatus
// @Tags Authentication
// @Produce json
// @Success 200 {object} StatusResponse
// @Failure 401 {object} lib.ErrorResponse
// @Router /auth/status [get]
func Status(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		lib.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	refreshToken, err := cfg.DB.GetRefreshToken(r.Context(), cookie.Value)
	if err != nil {
		lib.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	if refreshToken.ExpiresAt.Before(time.Now()) {
		cookie.MaxAge = -1
		http.SetCookie(w, cookie)
		cfg.DB.DeleteRefreshToken(r.Context(), cookie.Value)
		lib.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]bool{"loggedIn": true})
}
