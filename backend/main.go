//go:generate swag init --dir . --output docs --parseDependency --parseInternal
package main

import (
	"log"
	"net/http"
	"time"

	_ "github.com/AtwolfOG/devora/docs"
	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/room"
	"github.com/AtwolfOG/devora/user"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)


func configWrapper(config *config.Config, handler func(w http.ResponseWriter, r *http.Request, config *config.Config)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		handler(w, r, config)
	}
}

// @title Devora API
// @version 1.0
// @description API for Devora - a platform for live technical interviews
// @host localhost:8080
// @BasePath /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	config := config.LoadConfig()
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{config.FrontendUrl},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
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
	authRouter.Get("/callback/github", configWrapper(config, auth.LoginWithGithub))
	authRouter.Get("/link/github", configWrapper(config, auth.SendGithubLink))
	authRouter.Get("/callback/google", configWrapper(config, auth.LoginWithGoogle))
	authRouter.Get("/link/google", configWrapper(config, auth.SendGoogleLink))
	authRouter.Get("/verify/{code}", configWrapper(config, auth.VerifyEmail))
	authRouter.Post("/refresh", configWrapper(config, auth.RefreshToken))
	authRouter.Get("/status", configWrapper(config, auth.Status))
	r.Mount("/auth", authRouter)

	apiRouter := chi.NewRouter()
	apiRouter.Use(auth.AuthMiddleware)
	// this is the user api
	userRouter := chi.NewRouter()
	userRouter.Get("/profile", configWrapper(config, user.GetUserData))
	userRouter.Get("/dashboard", configWrapper(config, user.GetDashboardStat))
	userRouter.Get("/{user_id}", configWrapper(config, user.GetUser))
	userRouter.Get("/settings", configWrapper(config, user.GetSettings))
	apiRouter.Mount("/users", userRouter)
	// this is the room api
	roomRouter := chi.NewRouter()
	roomRouter.Get("/", configWrapper(config, room.GetRooms))
	roomRouter.Post("/", configWrapper(config, room.CreateRoom))
	roomRouter.Get("/{room_id}", configWrapper(config, room.GetRoomByID))
	roomRouter.Delete("/{room_id}", configWrapper(config, room.DeleteRoom))
	roomRouter.Put("/{room_id}", configWrapper(config, room.UpdateRoom))
	roomRouter.Patch("/{room_id}/join", configWrapper(config, room.AddParticipantToRoom))
	roomRouter.Patch("/{room_id}/leave", configWrapper(config, room.RemoveParticipantFromRoom))
	roomRouter.Patch("/{room_id}/cancel", configWrapper(config, room.CancelRoom))
	roomRouter.Patch("/{room_id}/reschedule", configWrapper(config, room.RescheduleRoom))
	roomRouter.Patch("/{room_id}/submit-feedback", configWrapper(config, room.SubmitFeedback))
	roomRouter.Post("/{room_id}/questions", configWrapper(config, room.CreateQuestion))
	roomRouter.Get("/{room_id}/questions", configWrapper(config, room.GetRoomQuestions))
	roomRouter.Post("/{room_id}/questions/{question_id}/answer", configWrapper(config, room.SubmitAnswer))
	roomRouter.Get("/{room_id}/questions/{question_id}/answer", configWrapper(config, room.GetAnswer))
	roomRouter.Post("/{room_id}/questions/{question_id}/code", configWrapper(config, room.SubmitCode))
	roomRouter.Get("/{room_id}/questions/{question_id}/code", configWrapper(config, room.GetCode))
	roomRouter.Delete("/{room_id}/questions/{question_id}", configWrapper(config, room.DeleteQuestion))
	roomRouter.Patch("/{room_id}/questions/{question_id}/pass", configWrapper(config, room.PassQuestion))
	roomRouter.Patch("/{room_id}/questions/{question_id}/fail", configWrapper(config, room.FailQuestion))
	apiRouter.Mount("/rooms", roomRouter)
	r.Mount("/api", apiRouter)

	r.Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL("/swagger/doc.json")))
	log.Println("Server started on port " + config.Port)
	srv := &http.Server{
		Addr:         ":" + config.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
	err := srv.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
