package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/google/uuid"
)

type TokenResponse struct {
	AccessToken string `json:"access_token"`
}
func getAccessToken(code string, cfg *config.Config) ( *TokenResponse, error){
	params := url.Values{
		"code": []string{code},
		"client_id": []string{cfg.GithubClientId},
		"client_secret": []string{cfg.GithubClientSecret},
	}
	req, err := http.NewRequest("POST", "https://github.com/login/oauth/access_token", strings.NewReader(params.Encode()))
	if err != nil {
		return nil, err 
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("failed to get access token")
	}
	var tokenResponse TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
		return nil, err
	}
	return &tokenResponse, nil
}
// user response from github api
type UserResponse struct {
	ID int32 `json:"id"`
	Login string `json:"login"`
	Name string `json:"name"`
	Email string `json:"email"`
	AvatarUrl string `json:"avatar_url"`
}
func getUser(token string) (*UserResponse, error){
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, err 
	}
	req.Header.Set("Authorization", "token " + token)
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("failed to get user")
	}
	var userResponse UserResponse
	if err := json.NewDecoder(resp.Body).Decode(&userResponse); err != nil {
		return nil, err
	}
	return &userResponse, nil
}

func LoginWithGithub(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code", http.StatusBadRequest)
		return
	}
	tokenResponse, err := getAccessToken(code, cfg)
	if err != nil {
		http.Error(w, "Failed to get access token", http.StatusInternalServerError)
		return
	}
	userResponse, err := getUser(tokenResponse.AccessToken)
	if err != nil {
		http.Error(w, "Failed to get user: " + err.Error(), http.StatusInternalServerError)
		return
	}

	existingUsers, err := cfg.DB.GetUsersByEmail(r.Context(), userResponse.Email)
	if err != nil {
		http.Error(w, "Failed to check if user exists", http.StatusInternalServerError)
		return
	}
	if len(existingUsers) > 0 {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	userId := uuid.New()
	err = cfg.DB.CreateUserWithGithub(r.Context(), database.CreateUserWithGithubParams{
		ID: userId,
		Name: userResponse.Name,
		ProfilePictureUrl: userResponse.AvatarUrl,
		Email: userResponse.Email,
	})
	if err != nil {
		http.Error(w, "Failed to create user: " + err.Error(), http.StatusInternalServerError)
		return
	}
	err = cfg.DB.CreateGithubOauth(r.Context(), database.CreateGithubOauthParams{
		UserID: userId,
		GithubID: userResponse.ID,
	})
	if err != nil {
		http.Error(w, "Failed to create github oauth", http.StatusInternalServerError)
		return
	}
	// this is to send the refresh and access token to the client through cookies and response body
	SendRefreshAndAccessToken(w, r, cfg, userId)
}
