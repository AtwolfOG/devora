package auth

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/AtwolfOG/devora/internal/database"
	"github.com/google/uuid"
)

type SignupRequest struct {
	Email string `json:"email"`
	Password string `json:"password"`
	Name string `json:"name"`
}

type SignupResponse struct {
	AccessToken string `json:"access_token"`
}

func SignupWithEmailAndPassword(w http.ResponseWriter, r *http.Request, db *database.Queries) {
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
	err = db.CreateUserWithEmailPassword(r.Context(), database.CreateUserWithEmailPasswordParams{
		ID: userId,
		Email: req.Email,
		Password: sql.NullString{String: HashedPassword, Valid: true},
		Name: req.Name,
	})
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}
	token, err := GenerateJWT(userId.String(), []byte(os.Getenv("JWT_SECRET")), 1 * time.Hour)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	refreshToken, err := GenerateRefreshToken()
	if err != nil {
		http.Error(w, "Failed to generate refresh token", http.StatusInternalServerError)
		return
	}
	err = db.CreateRefreshToken(r.Context(), database.CreateRefreshTokenParams{
		Token: refreshToken,
		UserID: userId,
	})
	if err != nil {
		http.Error(w, "Failed to create refresh token", http.StatusInternalServerError)
		return
	}
	cookie := http.Cookie{
		Name: "refresh_token",
		Value: refreshToken,
		Expires: time.Now().Add(7 * 24 * time.Hour),
		HttpOnly: true,
		// TODO: set to true for production
		Secure: false,
		SameSite: http.SameSiteStrictMode,
	}
	http.SetCookie(w, &cookie)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(SignupResponse{
		AccessToken: token,
	})
}
