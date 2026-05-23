package auth

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

// user response from github api
type githubUserResponse struct {
	ID        float64 `json:"id"`
	Login     string  `json:"login"`
	Name      string  `json:"name"`
	Email     string  `json:"email"`
	AvatarUrl string  `json:"avatar_url"`
}

// email response from github api
type githubEmailResponse struct {
	Email      string `json:"email"`
	Primary    bool   `json:"primary"`
	Verified   bool   `json:"verified"`
	Visibility string `json:"visibility"`
}

func getGithubUser(client *http.Client) (*githubUserResponse, error) {
	res, err := client.Get("https://api.github.com/user")
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, errors.New("failed to get user")
	}
	var userRes githubUserResponse
	if err := json.NewDecoder(res.Body).Decode(&userRes); err != nil {
		return nil, err
	}
	res1, err := client.Get("https://api.github.com/user/emails")
	if err != nil {
		return nil, err
	}
	defer res1.Body.Close()
	if res1.StatusCode != http.StatusOK {
		return nil, errors.New("failed to get user emails")
	}
	var userEmails []githubEmailResponse
	if err := json.NewDecoder(res1.Body).Decode(&userEmails); err != nil {
		return nil, err
	}
	// find the primary email
	var primaryEmail string
	for _, email := range userEmails {
		if email.Primary && email.Verified && !strings.Contains(strings.ToLower(email.Email), "@users.noreply.github.com") {
			primaryEmail = email.Email
			break
		}
	}
	if primaryEmail == "" {
		return nil, errors.New("no primary email found")
	}

	userRes.Email = primaryEmail
	return &userRes, nil
}

func LoginWithGithub(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	githubOauthConfig := &oauth2.Config{
		ClientID:     cfg.GithubClientId,
		ClientSecret: cfg.GithubClientSecret,
		RedirectURL:  cfg.FrontendUrl + "/auth/callback/github",
		Scopes:       []string{"user:email"},
		Endpoint:     github.Endpoint,
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
	if claims.Provider != "github" {
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
	tokenResponse, err := githubOauthConfig.Exchange(r.Context(), code)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get access token")
		return
	}
	// remove oauth state cookie
	cookie.MaxAge = -1
	http.SetCookie(w, cookie)
	// get the user profile from github
	githubClient := githubOauthConfig.Client(r.Context(), tokenResponse)
	userResponse, err := getGithubUser(githubClient)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user: "+err.Error())
		return
	}

	row, err := cfg.DB.GetUserByProviderId(r.Context(), database.GetUserByProviderIdParams{
		Provider: "github",
		ProviderID: sql.NullString{
			String: strconv.FormatInt(int64(userResponse.ID), 10),
			Valid:  true,
		},
	})
	// if no user is found with the given provider id and provider, create a new user
	if err == sql.ErrNoRows {
		signupNewUserWithGithub(w, r, cfg, userResponse)
		return
	}
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}

	// this is to send the refresh and access token to the client through cookies and response body
	SendRefreshAndAccessToken(w, r, cfg, row.Userid)
}

func signupNewUserWithGithub(w http.ResponseWriter, r *http.Request, cfg *config.Config, userResponse *githubUserResponse) {
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

		err = queries.CreateGithubOauth(r.Context(), database.CreateGithubOauthParams{
			UserID: userID,
			ProviderID: sql.NullString{
				String: strconv.FormatInt(int64(userResponse.ID), 10),
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

	err = queries.CreateGithubOauth(r.Context(), database.CreateGithubOauthParams{
		UserID: user.ID,
		ProviderID: sql.NullString{
			String: strconv.FormatInt(int64(userResponse.ID), 10),
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

func SendGithubLink(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	githubOauthConfig := &oauth2.Config{
		ClientID:     cfg.GithubClientId,
		ClientSecret: cfg.GithubClientSecret,
		RedirectURL:  cfg.FrontendUrl + "/auth/callback/github",
		Scopes:       []string{"user:email"},
		Endpoint:     github.Endpoint,
	}

	tokenString, token, err := generateOAuthStateToken("github", cfg.JWTSecret)
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
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(15 * time.Minute),
	}
	http.SetCookie(w, &cookie)
	url := githubOauthConfig.AuthCodeURL(tokenString)

	lib.WriteJSON(w, http.StatusOK, map[string]string{
		"url": url,
	})
}
