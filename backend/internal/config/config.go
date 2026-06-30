package config

import (
	"context"
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/AtwolfOG/devora/internal/database"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type Config struct {
	DatabaseURL        string
	JWTSecret          []byte
	DB                 *database.Queries
	GithubClientId     string
	GithubClientSecret string
	GoogleClientId     string
	GoogleClientSecret string
	SmtpUser           string
	SmtpPassword       string
	Domain             string
	AppName            string
	Environment        string
	FrontendUrl        string
	Database           *sql.DB
	Port               string
}

func LoadConfig() *Config {
	err := godotenv.Load(".env.local")
	if err != nil {
		log.Fatal("Error loading .env file: ", err.Error())
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("Error loading JWT secret")
	}

	githubClientId := os.Getenv("GITHUB_CLIENT_ID")
	if githubClientId == "" {
		log.Fatal("Error loading Github client id")
	}

	githubClientSecret := os.Getenv("GITHUB_CLIENT_SECRET")
	if githubClientSecret == "" {
		log.Fatal("Error loading Github client secret")
	}

	googleClientId := os.Getenv("GOOGLE_CLIENT_ID")
	if googleClientId == "" {
		log.Fatal("Error loading Google client id")
	}

	googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	if googleClientSecret == "" {
		log.Fatal("Error loading Google client secret")
	}

	smtpUser := os.Getenv("SMTP_USER")
	if smtpUser == "" {
		log.Fatal("Error loading SMTP user")
	}

	smtpPassword := os.Getenv("SMTP_PASSWORD")
	if smtpPassword == "" {
		log.Fatal("Error loading SMTP password")
	}

	domain := os.Getenv("DOMAIN")
	if domain == "" {
		log.Fatal("Error loading domain")
	}

	appName := os.Getenv("APP_NAME")
	if appName == "" {
		log.Fatal("Error loading app name")
	}

	environment := os.Getenv("ENVIRONMENT")
	if environment == "" {
		log.Fatal("Error loading environment")
	}

	frontendUrl := os.Getenv("FRONTEND_URL")
	if frontendUrl == "" {
		log.Fatal("Error loading frontend url")
	}

	databaseUrl := os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		log.Fatal("Error loading database url")
	}

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("Error loading port")
	}

	// Create database connection with proper configuration
	db, err := sql.Open("postgres", databaseUrl)
	if err != nil {
		log.Fatal("Error opening database connection:", err)
	}

	// Set connection pool parameters for better performance
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	dbQueries := database.New(db)

	return &Config{
		DatabaseURL:        databaseUrl,
		JWTSecret:          []byte(jwtSecret),
		GithubClientId:     githubClientId,
		GithubClientSecret: githubClientSecret,
		GoogleClientId:     googleClientId,
		GoogleClientSecret: googleClientSecret,
		SmtpUser:           smtpUser,
		SmtpPassword:       smtpPassword,
		FrontendUrl:        frontendUrl,
		Domain:             domain,
		AppName:            appName,
		Environment:        environment,
		Database:           db,
		DB:                 dbQueries,
		Port:               port,
	}
}

func (c *Config) NewTx(ctx context.Context) (*database.Queries, *sql.Tx, error) {
	tx, err := c.Database.BeginTx(ctx, nil)
	if err != nil {
		return nil, nil, err
	}
	return database.New(tx), tx, nil
}
