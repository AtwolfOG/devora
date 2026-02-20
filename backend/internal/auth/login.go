package auth

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/AtwolfOG/devora/internal/database"
)

type LoginRequest struct {
	Email string `json:"email"`
	Password string `json:"password"`
}

func LoginWithEmailAndPassword(w http.ResponseWriter, r *http.Request, db *database.Queries) {
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

	user, err := db.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	if !VerifyPassword(req.Password, user.Password.String) {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	token, err := GenerateJWT(req.Email, []byte(os.Getenv("JWT_SECRET")), 24 * time.Hour)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	refreshToken, err := GenerateRefreshToken()
	if err != nil {
		http.Error(w, "Failed to generate refresh token", http.StatusInternalServerError)
		return
	}
	cookie := http.Cookie{
		Name: "refresh_token",
		Value: refreshToken,
		Expires: time.Now().Add(7 * 24 * time.Hour),
		HttpOnly: true,
		Secure: true,
		SameSite: http.SameSiteLaxMode,
	}
	w.Header().Set("Content-Type", "application/json")
	http.SetCookie(w, &cookie)
	json.NewEncoder(w).Encode(SignupResponse{
		AccessToken: token,
	})	
}