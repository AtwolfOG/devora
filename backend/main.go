package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/room"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/lib/pq"
)

const port = "8080"

// func dbWrapper(db *database.Queries, handler func(w http.ResponseWriter, r *http.Request, db *database.Queries)) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		handler(w, r, db)
// 	}
// }

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

	r.Use(middleware.Logger)
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
		if _, err := w.Write([]byte("<a href='https://github.com/login/oauth/authorize?client_id=" + config.GithubClientId + "'>Login with Github</a>")); err != nil {
			log.Printf("write error: %v", err)
		}
	})
	authRouter.Post("/signup", configWrapper(config, auth.SignupWithEmailAndPassword))
	authRouter.Post("/login", configWrapper(config, auth.LoginWithEmailAndPassword))
	authRouter.Get("/github/callback", configWrapper(config, auth.LoginWithGithub))
	authRouter.Get("/verify/{code}", configWrapper(config, auth.VerifyEmail))
	authRouter.Get("/refresh", configWrapper(config, auth.RefreshToken))
	r.Mount("/auth", authRouter)
	apiRouter := chi.NewRouter()
	apiRouter.Use(auth.AuthMiddleware)
	// this is the room api
	roomRouter := chi.NewRouter()
	roomRouter.Get("/", configWrapper(config, room.GetRooms))
	roomRouter.Post("/create", configWrapper(config, room.CreateRoom))
	roomRouter.Get("/{room_id}", configWrapper(config, room.GetRoomByID))
	roomRouter.Delete("/{room_id}", configWrapper(config, room.DeleteRoom))
	roomRouter.Post("/questions", configWrapper(config, room.CreateQuestions))
	roomRouter.Get("/questions/{room_id}", configWrapper(config, room.GetRoomQuestions))
	roomRouter.Delete("/questions/{room_id}/{question_id}", configWrapper(config, room.DeleteQuestion))
	apiRouter.Mount("/room", roomRouter)
	r.Mount("/api", apiRouter)
	log.Println("Server started on port " + port)
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
	err = srv.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}