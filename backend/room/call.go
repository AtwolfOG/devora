package room

// import (
// 	"net/http"

// 	"github.com/AtwolfOG/devora/internal/config"
// 	"github.com/gorilla/websocket"
// )

// type room struct {
// 	id string
// 	users map[string]*websocket.Conn
// }
// type message struct {
// 	Type string `json:"type"`

// }

// var upgrader = websocket.Upgrader{
// 	ReadBufferSize:  1024,
// 	WriteBufferSize: 1024,
// 	CheckOrigin: func(r *http.Request) bool {
// 		return true
// 	},
// }

// var rooms = make(map[string]*websocket.Conn)

// func CreateCall(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
// 	userId := r.URL.Query().Get("userId")
// 	conn, err := upgrader.Upgrade(w, r, nil)
// 	if err != nil {
// 		return
// 	}
// 	defer conn.Close()

// }
