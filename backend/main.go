package main

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/AtwolfOG/devora/config"
	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/go-chi/chi/v5"
	_ "github.com/lib/pq"
)

const port = "8080"

func configWrapper(db *database.Queries, handler func(w http.ResponseWriter, r *http.Request, db *database.Queries)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		handler(w, r, db)
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

	r.Get("/", 	func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello World"))
	})
	r.Post("/signup", configWrapper(dbQueries, auth.SignupWithEmailAndPassword))
	log.Println("Server started on port " + port)
	http.ListenAndServe(":"+port, r)
}