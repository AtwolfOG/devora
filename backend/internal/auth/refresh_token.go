package auth

import (
	"crypto/rand"
	"encoding/base64"
	"log"
	"net/http"
	"time"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
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

func GenerateVerificationCode() string {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return ""
	}
	return base64.URLEncoding.EncodeToString(b)
}

type SignupResponse struct {
	AccessToken string `json:"access_token"`
}

func SendRefreshAndAccessToken(w http.ResponseWriter, r *http.Request, cfg *config.Config, userId uuid.UUID) {

	refreshToken, err := GenerateRefreshToken()
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}
	err = cfg.DB.CreateRefreshToken(r.Context(), database.CreateRefreshTokenParams{
		Token:     refreshToken,
		UserID:    userId,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to create refresh token")
		return
	}
	token, err := GenerateJWT(userId.String(), []byte(cfg.JWTSecret), 1*time.Hour)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}
	cookie := http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		// TODO: set to true for production
		Secure:   cfg.Environment != "development",
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   60 * 60 * 24 * 7,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	}
	http.SetCookie(w, &cookie)
	lib.WriteJSON(w, http.StatusOK, SignupResponse{AccessToken: token})
}

func RefreshToken(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		lib.WriteError(w, http.StatusUnauthorized, "Failed to get refresh token")
		return
	}
	refreshToken, err := cfg.DB.GetRefreshToken(r.Context(), cookie.Value)
	if err != nil {
		cookie.MaxAge = -1
		http.SetCookie(w, cookie)
		if err := cfg.DB.DeleteRefreshToken(r.Context(), cookie.Value); err != nil {
			log.Printf("failed to delete refresh token: %v", err)
		}
		lib.WriteError(w, http.StatusUnauthorized, "Failed to get refresh token")
		return
	}

	user, err := cfg.DB.GetUserById(r.Context(), refreshToken.UserID)
	if err != nil {
		cookie.MaxAge = -1
		http.SetCookie(w, cookie)
		if err := cfg.DB.DeleteRefreshToken(r.Context(), cookie.Value); err != nil {
			log.Printf("failed to delete refresh token: %v", err)
		}
		lib.WriteError(w, http.StatusUnauthorized, "Failed to get user")
		return
	}

	token, err := GenerateJWT(user.ID.String(), []byte(cfg.JWTSecret), 1*time.Hour)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}
	lib.WriteJSON(w, http.StatusOK, map[string]string{"access_token": token})

}
