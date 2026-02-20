package auth

import (
	"fmt"
	"testing"
	"time"
)

func TestGenerateJWT(t *testing.T) {
	token, err := GenerateJWT("[EMAIL_ADDRESS]", []byte("secret"), time.Hour)
	if err != nil {
		t.Error(err)
	}
	if token == "" {
		t.Error("token is empty")
	}
}

func TestVerifyJWT(t *testing.T) {
	token, err := GenerateJWT("[EMAIL_ADDRESS]", []byte("secret"), time.Hour)
	if err != nil {
		t.Error(err)
	}
	// fmt.Println(token)
	claims, err := VerifyJWT(token, []byte("secret"))
	fmt.Println(claims)
	if err != nil {
		t.Error(err)
	}
	if claims.Email != "[EMAIL_ADDRESS]" {
		t.Error("email is not matching")
	}
	if claims.Issuer != "devora" {
		t.Error("issuer is not matching")
	}
	if claims.Audience[0] != "devora" {
		t.Error("audience is not matching")
	}
}

func TestExpiredJWT(t *testing.T) {
	token, err := GenerateJWT("[EMAIL_ADDRESS]", []byte("secret"), time.Second)
	if err != nil {
		t.Error(err)
	}
	// fmt.Println(token) 
	time.Sleep(2 * time.Second)
	claims, err := VerifyJWT(token, []byte("secret"))
	if err != nil {
		return
	}
	if err == nil {
		t.Error("token is not expired")
	}
	if claims.Email != "[EMAIL_ADDRESS]" {
		t.Error("email is not matching")
	}
	if claims.Issuer != "devora" {
		t.Error("issuer is not matching")
	}
	if claims.Audience[0] != "devora" {
		t.Error("audience is not matching")
	}
}