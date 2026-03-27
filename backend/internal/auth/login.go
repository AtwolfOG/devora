package auth

import (
	"encoding/json"
	"net/http"

	"github.com/AtwolfOG/devora/internal/config"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func LoginWithEmailAndPassword(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	var req LoginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	if req.Email == "" || req.Password == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	if !IsValidEmail(req.Email) {
		http.Error(w, "Invalid email", http.StatusBadRequest)
		return
	}

	if !IsValidPassword(req.Password) {
		http.Error(w, "try a stronger password", http.StatusBadRequest)
		return
	}

	user, err := cfg.DB.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	if !VerifyPassword(req.Password, user.Password.String) {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	if user.Pending.Bool {
		http.Error(w, "User not verified", http.StatusUnauthorized)
		return
	}

	// this is to send the refresh and access token to the client
	SendRefreshAndAccessToken(w, r, cfg, user.ID)
}
