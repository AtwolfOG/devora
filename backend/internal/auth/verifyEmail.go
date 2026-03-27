package auth

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
)

func VerifyEmail(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	code := r.PathValue("code")
	if code == "" {
		http.Error(w, "Missing verification code", http.StatusBadRequest)
		return
	}
	verificationLink, err := cfg.DB.GetVerificationLink(r.Context(), code)
	if err != nil {
		http.Error(w, "Invalid verification code", http.StatusBadRequest)
		return
	}
	if verificationLink.ExpiresAt.Before(time.Now()) {
		http.Error(w, "Verification code has expired", http.StatusBadRequest)
		return
	}
	err = cfg.DB.DeleteVerificationLink(r.Context(), code)
	if err != nil {
		http.Error(w, "Failed to delete verification link", http.StatusInternalServerError)
		return
	}
	err = cfg.DB.SetPendingStatus(r.Context(), database.SetPendingStatusParams{
		ID:      verificationLink.UserID,
		Pending: sql.NullBool{Bool: false, Valid: true},
	})
	if err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}
	_ = cfg.DB.DeleteVerificationLinksByUserId(r.Context(), verificationLink.UserID)
	SendRefreshAndAccessToken(w, r, cfg, verificationLink.UserID)
}
