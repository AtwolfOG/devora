package auth

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
)

func VerifyEmail(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	code := r.PathValue("code")
	if code == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing verification code")
		return
	}
	verificationLink, err := cfg.DB.GetVerificationLink(r.Context(), code)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Invalid verification code")
		return
	}
	if verificationLink.ExpiresAt.Before(time.Now()) {
		lib.WriteError(w, http.StatusBadRequest, "Verification code has expired")
		return
	}
	err = cfg.DB.DeleteVerificationLink(r.Context(), code)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to delete verification link")
		return
	}
	err = cfg.DB.SetPendingStatus(r.Context(), database.SetPendingStatusParams{
		ID:      verificationLink.UserID,
		Pending: sql.NullBool{Bool: false, Valid: true},
	})
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}
	_ = cfg.DB.DeleteVerificationLinksByUserId(r.Context(), verificationLink.UserID)
	SendRefreshAndAccessToken(w, r, cfg, verificationLink.UserID)
}
