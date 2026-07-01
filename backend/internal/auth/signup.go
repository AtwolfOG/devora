package auth

import (
	"context"
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

// SignupWithEmailAndPassword godoc
//
// @Summary Sign up with email and password
// @Description Registers a new user with name, email, and password. Sends a verification email.
// @ID signUp
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body SignupRequest true "Signup request body"
// @Success 200 {object} lib.MessageResponse
// @Failure 400 {object} lib.ErrorResponse
// @Failure 500 {object} lib.ErrorResponse
// @Router /auth/signup [post]
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
	// check if user exists and is unverified
	exists, userID, err := isUserUnverified(r.Context(), cfg, req)
	if exists {
		if err != nil {
			lib.WriteError(w, http.StatusInternalServerError, "Failed to signup User")
			return
		}
		if _, err := signupUnverifiedUser(r.Context(), cfg, req, userID); err != nil {
			lib.WriteError(w, http.StatusInternalServerError, "Failed to signup User")
			return
		}
		lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Verification email sent"})
		return
	}

	// check user already exists in database
	exists, err = cfg.DB.CheckUserExists(r.Context(), req.Email)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to signup User")
		return
	}
	if exists {
		lib.WriteJSON(w, http.StatusBadRequest, "User already exists")
		return
	}
	if _, err := signupNewUser(r.Context(), cfg, req); err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to signup User")
		return
	}

	lib.WriteJSON(w, http.StatusOK, map[string]string{"message": "Verification email sent"})
}

func signupNewUser(ctx context.Context, cfg *config.Config, req SignupRequest) (uuid.UUID, error) {
	HashedPassword, err := HashPassword(req.Password)
	if err != nil {
		return uuid.Nil, err
	}
	queries, tx, err := cfg.NewTx(ctx)
	if err != nil {
		return uuid.Nil, err
	}
	defer tx.Rollback()
	userID, err := queries.CreateUser(ctx, database.CreateUserParams{
		Email:    req.Email,
		Name:     req.Name,
		Verified: false,
	})
	if err != nil {
		tx.Rollback()
		return uuid.Nil, err
	}

	err = queries.CreateEmailOauth(ctx, database.CreateEmailOauthParams{
		UserID:   userID,
		Password: sql.NullString{String: HashedPassword, Valid: true},
	})
	if err != nil {
		tx.Rollback()
		return uuid.Nil, err
	}

	go sendVerficationEmail(cfg, userID, req.Email)

	return userID, nil
}

func signupUnverifiedUser(ctx context.Context, cfg *config.Config, req SignupRequest, userID uuid.UUID) (uuid.UUID, error) {
	HashedPassword, err := HashPassword(req.Password)
	if err != nil {
		return uuid.Nil, err
	}
	queries, tx, err := cfg.NewTx(ctx)
	if err != nil {
		return uuid.Nil, err
	}
	defer tx.Rollback()
	err = queries.UpdateOauthPassword(ctx, database.UpdateOauthPasswordParams{
		UserID:   userID,
		Password: sql.NullString{String: HashedPassword, Valid: true},
	})
	if err != nil {
		tx.Rollback()
		return uuid.Nil, err
	}
	go sendVerficationEmail(cfg, userID, req.Email)
	return userID, nil
}

func isUserUnverified(ctx context.Context, cfg *config.Config, req SignupRequest) (bool, uuid.UUID, error) {
	user, err := cfg.DB.GetUnverifiedUserByEmail(ctx, req.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, uuid.Nil, nil
		}
		return false, uuid.Nil, err
	}
	return true, user.ID, nil
}

func sendVerficationEmail(cfg *config.Config, userID uuid.UUID, userEmail string) {
	verificationCode, err := generateRandomString(32)
	if err != nil {
		return
	}
	err = cfg.DB.CreateVerificationLink(context.Background(), database.CreateVerificationLinkParams{
		UserID:    userID,
		Code:      verificationCode,
		ExpiresAt: time.Now().Add(15 * time.Minute),
	})
	if err != nil {
		return
	}
	verificationLink := fmt.Sprintf("%s/auth/verify/%s", cfg.FrontendUrl, verificationCode)
	tmpl, err := email.CreateTemplate(email.EmailData{
		AppName:          cfg.AppName,
		VerificationLink: verificationLink,
		RecipientName:    userEmail,
		ExpiryMinutes:    15,
		Year:             time.Now().Year(),
	})
	if err != nil {
		fmt.Println("Failed to create verification email:", err)
		return
	}
	fmt.Println("template created")
	err = email.SendEmail(cfg, userEmail, tmpl)
	if err != nil {
		fmt.Println("Failed to send verification email:", err)
		return
	}
	fmt.Println("email sent")
}
