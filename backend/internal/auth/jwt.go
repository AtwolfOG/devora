package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	Id string `json:"id"`
	jwt.RegisteredClaims
}

type oauthStateToken struct {
	Token    string `json:"token"`
	Provider string `json:"provider"`
	jwt.RegisteredClaims
}

func GenerateJWT(id string, secret []byte, duration time.Duration) (string, error) {
	claims := &Claims{
		Id: id,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "devora",
			Audience:  []string{"devora"},
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

func VerifyJWT(tokenString string, secret []byte) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}

func generateOAuthStateToken(provider string, secret []byte) (string, string, error) {
	tokenString, err := generateRandomString(64)
	if err != nil {
		return "", "", err
	}
	claims := oauthStateToken{
		Token:    tokenString,
		Provider: provider,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "devora",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	jwtToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(secret)
	if err != nil {
		return "", "", err
	}
	return jwtToken, tokenString, nil
}

func verifyOAuthStateToken(tokenString string, secret []byte) (*oauthStateToken, error) {
	token, err := jwt.ParseWithClaims(tokenString, &oauthStateToken{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*oauthStateToken); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}
