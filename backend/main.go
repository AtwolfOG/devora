package main

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/go-chi/chi/v5"
	_ "github.com/lib/pq"
)

const port = "8080"

func dbWrapper(db *database.Queries, handler func(w http.ResponseWriter, r *http.Request, db *database.Queries)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		handler(w, r, db)
	}
}

func configWrapper(config *config.Config, handler func(w http.ResponseWriter, r *http.Request, config *config.Config)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		handler(w, r, config)
	}
}

func main() {
	config := config.LoadConfig()	
	r := chi.NewRouter()
	db, err := sql.Open("postgres", config.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	dbQueries := database.New(db)
	config.DB = dbQueries

	authRouter := chi.NewRouter()
	// this is for testing purposes
	authRouter.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Println(r.URL.Path)
			next.ServeHTTP(w, r)
		})
	})
	// this is for testing purposes
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("<a href='https://github.com/login/oauth/authorize?client_id=" + config.GithubClientId + "'>Login with Github</a>"))
	})
	authRouter.Post("/signup", configWrapper(config, auth.SignupWithEmailAndPassword))
	authRouter.Post("/login", configWrapper(config, auth.LoginWithEmailAndPassword))
	authRouter.Get("/github/callback", configWrapper(config, auth.LoginWithGithub))
	authRouter.Get("/verify/{code}", configWrapper(config, auth.VerifyEmail))
	authRouter.Get("/refresh", configWrapper(config, auth.RefreshToken))
	r.Mount("/auth", authRouter)
	log.Println("Server started on port " + port)
	err = http.ListenAndServe(":"+port, r)
	if err != nil{
		log.Fatal(err)
	}
}