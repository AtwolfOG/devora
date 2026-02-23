package auth

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"time"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/google/uuid"
)

func GenerateRefreshToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

type SignupResponse struct {
	AccessToken string `json:"access_token"`
}
func SendRefreshAndAccessToken(w http.ResponseWriter, r *http.Request, cfg *config.Config, userId uuid.UUID)  {
	
	refreshToken, err := GenerateRefreshToken()
	if err != nil {
		http.Error(w, "Failed to generate refresh token", http.StatusInternalServerError)
		return
	}
	err = cfg.DB.CreateRefreshToken(r.Context(), database.CreateRefreshTokenParams{
		Token: refreshToken,
		UserID: userId,
		
	})
	if err != nil {
		http.Error(w, "Failed to create refresh token", http.StatusInternalServerError)
		return
	}
	token, err := GenerateJWT(userId.String(), []byte(cfg.JWTSecret), 1 * time.Hour)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	cookie := http.Cookie{
		Name: "refresh_token",
		Value: refreshToken,
		HttpOnly: true,
		// TODO: set to true for production
		Secure: false,
		SameSite: http.SameSiteLaxMode,
		Path: "/",
		MaxAge: 60 * 60 * 24 * 7,
		Expires: time.Now().Add(7 * 24 * time.Hour),
	}
	http.SetCookie(w, &cookie)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(SignupResponse{
		AccessToken: token,
	})
}