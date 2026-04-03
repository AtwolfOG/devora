package config

import (
	"log"
	"os"

	"github.com/AtwolfOG/devora/internal/database"
	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL        string
	JWTSecret          []byte
	DB                 *database.Queries
	GithubClientId     string
	GithubClientSecret string
	SmtpUser           string
	SmtpPassword       string
	Domain             string
	AppName            string
	Environment        string
	FrontendUrl 	   string
}

func LoadConfig() *Config {
	err := godotenv.Load(".env.local")
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	return &Config{
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		JWTSecret:          []byte(os.Getenv("JWT_SECRET")),
		GithubClientId:     os.Getenv("GITHUB_CLIENT_ID"),
		GithubClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		SmtpUser:           os.Getenv("SMTP_USER"),
		SmtpPassword:       os.Getenv("SMTP_PASSWORD"),
		FrontendUrl:        os.Getenv("FRONTEND_URL"),
		Domain:             os.Getenv("DOMAIN"),
		AppName:            os.Getenv("APP_NAME"),
		Environment:        os.Getenv("ENVIRONMENT"),
	}
}
