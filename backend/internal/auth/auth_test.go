package auth

import "testing"

func TestIsValidEmail(t *testing.T) {
	if IsValidEmail("[EMAIL_ADDRESS]") {
		t.Error("IsValidEmail returned false for a valid email")
	}
}

func TestHashPassword(t *testing.T) {
	hashedPassword, err := HashPassword("password")
	if err != nil {
		t.Error(err)
	}
	if hashedPassword == "" {
		t.Error("HashPassword returned an empty string")
	}
}

func TestVerifyPassword(t *testing.T) {
	hashedPassword, err := HashPassword("password")
	if err != nil {
		t.Error(err)
	}
	if !VerifyPassword("password", hashedPassword) {
		t.Error("VerifyPassword returned false")
	}
}

var passwords = []string{
	"Alsuf90493#",
	"Alsuf90493!",
	"Alsuf90493@",
	"Alsuf90493$",
	"Alsuf90493%",
	"Alsuf90493^",
	"Alsuf90493&",
	"Alsuf90493*",
}

func TestMultiplePassword(t *testing.T) {
	for _, password := range passwords {
		if !IsValidPassword(password) {
			t.Errorf("IsValidPassword returned false for password: %s", password)
		}
		hashedPassword, err := HashPassword(password)
		if err != nil {
			t.Error(err)
		}
		if !VerifyPassword(password, hashedPassword) {
			t.Errorf("VerifyPassword returned false for password: %s", password)
		}
	}
}
