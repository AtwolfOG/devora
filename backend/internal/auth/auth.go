package auth

import (
	"context"
	"net/http"
	"os"
)

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
		ctx := context.WithValue(r.Context(), "user_id", claims.Id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}