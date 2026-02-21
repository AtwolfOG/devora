package auth

import (
	"net/http"

	"github.com/AtwolfOG/devora/internal/database"
)

func LoginWithGithub(w http.ResponseWriter, r *http.Request, db *database.Queries) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code", http.StatusBadRequest)
		return
	}
    w.Header().Set("Location", "/new-page")
    w.Write([]byte("<a href=\"/new-page\">Redirecting...</a>"))
    w.WriteHeader(http.StatusFound)
}




func RedirectAndSendHtml(w http.ResponseWriter, r *http.Request, token string) {
	
}