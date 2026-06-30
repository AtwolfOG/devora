package auth

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// user response from github api
type googleUserResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Verified bool   `json:"verified_email"`
	Picture  string `json:"picture"`
}

func getGoogleUser(client *http.Client) (*googleUserResponse, error) {
	res, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, errors.New("failed to get user")
	}
	var userResponse googleUserResponse
	if err := json.NewDecoder(res.Body).Decode(&userResponse); err != nil {
		return nil, err
	}
	if !userResponse.Verified || userResponse.Email == "" {
		return nil, errors.New("email not verified or email not found")
	}
	return &userResponse, nil
}

// LoginWithGoogle godoc
//
// @Summary Log in with Google OAuth
// @Tags Authentication
// @Produce json
// @Param code query string true "Google OAuth authorization code"
// @Param state query string true "OAuth state token"
// @Success 200 {object} SignupResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/callback/google [get]
func LoginWithGoogle(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	googleOauthConfig := &oauth2.Config{
		ClientID:     cfg.GoogleClientId,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.FrontendUrl + "/auth/callback/google",
		Scopes:       []string{"profile", "email"},
		Endpoint:     google.Endpoint,
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing code")
		return
	}
	// this is to verify the oauth state token
	state := r.URL.Query().Get("state")
	if state == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing oauth state")
		return
	}
	claims, err := verifyOAuthStateToken(state, cfg.JWTSecret)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Invalid oauth state")
		return
	}
	if claims.Provider != "google" {
		lib.WriteError(w, http.StatusBadRequest, "Invalid oauth state provider")
		return
	}
	cookie, err := r.Cookie("oauth_state")
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Missing oauth state")
		return
	}
	if claims.Token != cookie.Value {
		lib.WriteError(w, http.StatusBadRequest, "Invalid oauth state")
		return
	}
	tokenResponse, err := googleOauthConfig.Exchange(r.Context(), code)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get access token")
		return
	}
	// remove oauth state cookie
	cookie.MaxAge = -1
	http.SetCookie(w, cookie)
	// get the user profile from google
	googleClient := googleOauthConfig.Client(r.Context(), tokenResponse)
	userResponse, err := getGoogleUser(googleClient)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user: "+err.Error())
		return
	}

	row, err := cfg.DB.GetUserByProviderId(r.Context(), database.GetUserByProviderIdParams{
		Provider: "google",
		ProviderID: sql.NullString{
			String: userResponse.ID,
			Valid:  true,
		},
	})
	// if no user is found with the given provider id and provider, create a new user
	if err == sql.ErrNoRows {
		signupNewUserWithGoogle(w, r, cfg, userResponse)
		return
	}
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}

	// this is to send the refresh and access token to the client through cookies and response body
	SendRefreshAndAccessToken(w, r, cfg, row.Userid)
}

func signupNewUserWithGoogle(w http.ResponseWriter, r *http.Request, cfg *config.Config, userResponse *googleUserResponse) {
	// check if the user already exists by email
	user, err := cfg.DB.GetUserByEmail(r.Context(), userResponse.Email)
	if err == sql.ErrNoRows {
		// create a new user
		queries, tx, err := cfg.NewTx(r.Context())
		if err != nil {
			lib.WriteError(w, http.StatusInternalServerError, "Failed to signup User")
			return
		}
		defer tx.Rollback()

		userID, err := queries.CreateUser(r.Context(), database.CreateUserParams{
			Email:    userResponse.Email,
			Name:     userResponse.Name,
			Verified: true,
		})
		if err != nil {
			lib.WriteError(w, http.StatusInternalServerError, "Failed to signup User")
			return
		}

		err = queries.CreateGoogleOauth(r.Context(), database.CreateGoogleOauthParams{
			UserID: userID,
			ProviderID: sql.NullString{
				String: userResponse.ID,
				Valid:  true,
			},
			Email: userResponse.Email,
		})
		if err != nil {
			tx.Rollback()
			lib.WriteError(w, http.StatusInternalServerError, "Failed to signup User")
			return
		}

		if err = tx.Commit(); err != nil {
			lib.WriteError(w, http.StatusInternalServerError, "Failed to signup User")
			return
		}
	}
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}
	queries, tx, err := cfg.NewTx(r.Context())
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}
	defer tx.Rollback()

	// if the user is not verified, then delete the email and password oauth and verify the github oauth
	if user.Verified == false {
		err = queries.DeleteOauthByUserIdAndProvider(r.Context(), database.DeleteOauthByUserIdAndProviderParams{
			UserID:   user.ID,
			Provider: "email",
		})
		if err != nil {
			tx.Rollback()
			lib.WriteError(w, http.StatusInternalServerError, "Failed to update user")
			return
		}
	}

	err = queries.CreateGoogleOauth(r.Context(), database.CreateGoogleOauthParams{
		UserID: user.ID,
		ProviderID: sql.NullString{
			String: userResponse.ID,
			Valid:  true,
		},
		Email: userResponse.Email,
	})
	if err != nil {
		tx.Rollback()
		lib.WriteError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	err = queries.VerifyUser(r.Context(), user.ID)
	if err != nil {
		tx.Rollback()
		lib.WriteError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	if err = tx.Commit(); err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}
	// send the refresh and access token to the client through cookies and response body
	SendRefreshAndAccessToken(w, r, cfg, user.ID)
}

// SendGoogleLink godoc
//
// @Summary Get Google OAuth login URL
// @Tags Authentication
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/link/google [get]
func SendGoogleLink(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	googleOauthConfig := &oauth2.Config{
		ClientID:     cfg.GoogleClientId,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.FrontendUrl + "/auth/callback/google",
		Scopes:       []string{"profile", "email"},
		Endpoint:     google.Endpoint,
	}

	tokenString, token, err := generateOAuthStateToken("google", cfg.JWTSecret)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}
	cookie := http.Cookie{
		Name:     "oauth_state",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   cfg.Environment == "production",
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(15 * time.Minute),
	}
	http.SetCookie(w, &cookie)
	url := googleOauthConfig.AuthCodeURL(tokenString, oauth2.AccessTypeOffline, oauth2.SetAuthURLParam("prompt", "consent"))

	lib.WriteJSON(w, http.StatusOK, map[string]string{
		"url": url,
	})
}
