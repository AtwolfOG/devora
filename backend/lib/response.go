package lib

import (
	"encoding/json"
	"log"
	"net/http"
)

func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("writeJSON: %v", err)
	}
}

func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, map[string]string{"error": message})
}

// ErrorResponse represents an error response payload for API/Swagger documentation
type ErrorResponse struct {
	Error string `json:"error"`
}

// MessageResponse represents a standard message response payload for API/Swagger documentation
type MessageResponse struct {
	Message string `json:"message"`
}

// OAuthLinkResponse represents the OAuth URL redirect response payload for API/Swagger documentation
type OAuthLinkResponse struct {
	URL string `json:"url"`
}



