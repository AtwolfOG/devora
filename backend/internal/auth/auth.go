package auth

import (
	"context"
	"errors"
	"net/http"
	"os"

	"github.com/google/uuid"
)

type contextKey string

const userIDKey contextKey = "user_id"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := r.Header.Get("Authorization")
		if tokenString == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// remove "Bearer " from tokenString
		tokenString = tokenString[7:]
		claims, err := VerifyJWT(tokenString, []byte(os.Getenv("JWT_SECRET")))
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, claims.Id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetIdFromReqCtx(r *http.Request) (uuid.UUID, error) {
	id, ok := r.Context().Value(userIDKey).(string)
	if !ok {
		return uuid.Nil, errors.New("user id not found in request context")
	}
	userId, err := uuid.Parse(id)
	if err != nil {
		return uuid.Nil, errors.New("user id is not valid")
	}
	return userId, nil
}
