package auth

import "regexp"

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func IsValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}


var (
	hasMinLen  = regexp.MustCompile(`.{8,}`)
	hasUpper   = regexp.MustCompile(`[A-Z]`)
	hasLower   = regexp.MustCompile(`[a-z]`)
	hasNumber  = regexp.MustCompile(`[0-9]`)
	hasSpecial = regexp.MustCompile(`[!@#\$%\^&\*]`)
	)

func IsValidPassword(password string) bool {
	return hasMinLen.MatchString(password) &&
		hasUpper.MatchString(password) &&
		hasLower.MatchString(password) &&
		hasNumber.MatchString(password) &&
		hasSpecial.MatchString(password)
}
