package auth

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/google/uuid"
)

type SignupRequest struct {
	Email string `json:"email"`
	Password string `json:"password"`
	Name string `json:"name"`
}



func SignupWithEmailAndPassword(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	var req SignupRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" || req.Name == "" {
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
	
	HashedPassword, err := HashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	
	userId := uuid.New()
	err = cfg.DB.CreateUserWithEmailPassword(r.Context(), database.CreateUserWithEmailPasswordParams{
		ID: userId,
		Email: req.Email,
		Password: sql.NullString{String: HashedPassword, Valid: true},
		Name: req.Name,
	})
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}
	// this is to send the refresh and access token to the client through cookies and response body
	SendRefreshAndAccessToken(w, r, cfg, userId)
}
