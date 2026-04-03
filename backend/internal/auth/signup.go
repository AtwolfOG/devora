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
		lib.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	if req.Email == "" || req.Password == "" || req.Name == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	if !IsValidEmail(req.Email) {
		lib.WriteError(w, http.StatusBadRequest, "Invalid email")
		return
	}
	req.Email = strings.ToLower(req.Email)
	if !IsValidPassword(req.Password) {
		lib.WriteError(w, http.StatusBadRequest, "try a stronger password")
		return
	}

	HashedPassword, err := HashPassword(req.Password)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to hash password")
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
			lib.WriteError(w, http.StatusInternalServerError, "Failed to delete user")
			return
		}
	} else if len(existingUsers) > 0 && !existingUsers[0].Pending.Bool {
		lib.WriteError(w, http.StatusConflict, "User already exists")
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
		lib.WriteError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	verificationCode := GenerateVerificationCode()
	err = cfg.DB.CreateVerificationLink(r.Context(), database.CreateVerificationLinkParams{
		UserID:    userId,
		Code:      verificationCode,
		ExpiresAt: time.Now().Add(15 * time.Minute),
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to create verification link")
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
		lib.WriteError(w, http.StatusInternalServerError, "Failed to create verification email")
		return
	}
	fmt.Println("template created")
	err = email.SendEmail(cfg, req.Email, tmpl)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to send verification email")
		return
	}
	fmt.Println("email sent")
	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Verification email sent"})
}
