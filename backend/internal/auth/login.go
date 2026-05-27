package auth

import (
	"encoding/json"
	"net/http"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func LoginWithEmailAndPassword(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}
	defer r.Body.Close()
	if req.Email == "" || req.Password == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	if !IsValidEmail(req.Email) {
		lib.WriteError(w, http.StatusBadRequest, "Invalid email")
		return
	}

	if !IsValidPassword(req.Password) {
		lib.WriteError(w, http.StatusBadRequest, "try a stronger password")
		return
	}

	user, err := cfg.DB.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		lib.WriteError(w, http.StatusUnauthorized, "User not found")
		return
	}

	// check if the user is verified, if not ask to verify
	if !user.Verified {
		lib.WriteError(w, http.StatusUnauthorized, "User not verified, please verify your email")
		return
	}

	userOAuth, err := cfg.DB.GetOauthByUserIdAndProvider(r.Context(), database.GetOauthByUserIdAndProviderParams{
		UserID:   user.ID,
		Provider: "email",
	})
	if err != nil {
		lib.WriteError(w, http.StatusUnauthorized, "User not found")
		return
	}

	if !VerifyPassword(req.Password, userOAuth.Password.String) {
		lib.WriteError(w, http.StatusUnauthorized, "Invalid password")
		return
	}

	// this is to send the refresh and access token to the client
	SendRefreshAndAccessToken(w, r, cfg, user.ID)
}
