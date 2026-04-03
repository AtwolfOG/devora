package auth

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/AtwolfOG/devora/internal/auth/email"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
	"github.com/google/uuid"
)

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
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
	req.Email = strings.ToLower(req.Email)
	if !IsValidPassword(req.Password) {
		http.Error(w, "try a stronger password", http.StatusBadRequest)
		return
	}

	HashedPassword, err := HashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	existingUsers, err := cfg.DB.GetUsersByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, "Failed to check if user exists", http.StatusInternalServerError)
		return
	}
	if len(existingUsers) > 0 && existingUsers[0].Pending.Bool {
		err = cfg.DB.DeleteUser(r.Context(), existingUsers[0].ID)
		if err != nil {
			http.Error(w, "Failed to delete user", http.StatusInternalServerError)
			return
		}
	} else if len(existingUsers) > 0 && !existingUsers[0].Pending.Bool {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	userId := uuid.New()
	err = cfg.DB.CreateUserWithEmailPassword(r.Context(), database.CreateUserWithEmailPasswordParams{
		ID:       userId,
		Email:    req.Email,
		Password: sql.NullString{String: HashedPassword, Valid: true},
		Name:     req.Name,
	})
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	verificationCode := GenerateVerificationCode()
	err = cfg.DB.CreateVerificationLink(r.Context(), database.CreateVerificationLinkParams{
		UserID:    userId,
		Code:      verificationCode,
		ExpiresAt: time.Now().Add(15 * time.Minute),
	})
	if err != nil {
		http.Error(w, "Failed to create verification link", http.StatusInternalServerError)
		return
	}
	// send verification email
	verificationLink := fmt.Sprintf("%s/auth/verify/%s", cfg.FrontendUrl, verificationCode)

	tmpl, err := email.CreateTemplate(email.EmailData{
		AppName:          cfg.AppName,
		VerificationLink: verificationLink,
		RecipientName:    req.Email,
		ExpiryMinutes:    15,
		Year:             time.Now().Year(),
	})
	if err != nil {
		http.Error(w, "Failed to create verification email", http.StatusInternalServerError)
		return
	}
	fmt.Println("template created")
	err = email.SendEmail(cfg, req.Email, tmpl)
	if err != nil {
		http.Error(w, "Failed to send verification email", http.StatusInternalServerError)
		return
	}
	fmt.Println("email sent")
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Verification email sent"})
}
