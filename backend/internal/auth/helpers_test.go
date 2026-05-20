package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateRandomString(t *testing.T) {
	tokenLen := 24
	str1, err := generateRandomString(tokenLen)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	assert.Equal(t, tokenLen*2, len(str1))

	str2, err := generateRandomString(tokenLen)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	assert.NotEqual(t, str1, str2)
	str3, err := generateRandomString(tokenLen * 2)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	assert.Equal(t, tokenLen*4, len(str3))
}
