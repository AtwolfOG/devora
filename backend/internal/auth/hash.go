package auth

import "github.com/alexedwards/argon2id"

func HashPassword(password string) (string, error) {
	newPassword, err := argon2id.CreateHash(password, argon2id.DefaultParams)
	if err != nil {
		return "", err
	}
	return newPassword, nil
}

func VerifyPassword(password string, hash string) bool {
	match, err := argon2id.ComparePasswordAndHash(password, hash)
	if err != nil {
		return false
	}
	return match
}
