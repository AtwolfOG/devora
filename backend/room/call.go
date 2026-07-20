package room

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/AtwolfOG/devora/internal/auth"
	"github.com/AtwolfOG/devora/internal/config"
	"github.com/AtwolfOG/devora/internal/database"
	"github.com/AtwolfOG/devora/lib"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type user_t struct {
	id   uuid.UUID
	conn *websocket.Conn
	send chan message_t
}

type state_t struct {
	started bool
	ended   bool	
}

type room_t struct {
	id          uuid.UUID
	owner       *user_t
	participant *user_t
	state       state_t
}

type message_t struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

var rooms = make(map[uuid.UUID]*room_t)

func (u *user_t) writePump() {
	defer func() {
		if u.conn != nil {
			u.conn.Close()
		}
	}()
	for {
		msg, ok := <-u.send
		if !ok {
			// Channel closed, close the websocket
			return
		}
		// Write the message as JSON
		if u.conn == nil {
			return
		}
		if err := u.conn.WriteJSON(msg); err != nil {
			fmt.Println("writePump error:", err)
			break
		}
	}
}

func CreateCall(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	roomId := r.PathValue("room_id")
	if roomId == "" {
		lib.WriteError(w, http.StatusBadRequest, "Missing room id")
		return
	}
	roomUUID, err := uuid.Parse(roomId)
	if err != nil {
		lib.WriteError(w, http.StatusBadRequest, "Failed to parse room id")
		return
	}
	// this is for local development
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	// get the first message to know if the user is the owner or participant
	var msg message_t
	err = conn.ReadJSON(&msg)
	if err != nil {
		return
	}
	if msg.Type != "join" {
		writeErrorToConn(conn, "Invalid message type")
		conn.Close()
		return
	}

	// get access token from first message
	joinPayload, ok := msg.Payload.(map[string]interface{})
	if !ok {
		writeErrorToConn(conn, "Invalid access token")
		conn.Close()
		return
	}
	accessToken, ok := joinPayload["access_token"].(string)
	if !ok {
		writeErrorToConn(conn, "Invalid access token")
		conn.Close()
		return
	}
	

	user, err := auth.VerifyJWT(accessToken, cfg.JWTSecret)
	if err != nil {
		writeErrorToConn(conn, "Invalid access token")
		conn.Close()
		return
	}

	userId, err := uuid.Parse(user.Id)
	if err != nil {
		writeErrorToConn(conn, "Failed to parse user id")
		conn.Close()
		return
	}

	dbRoom, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		writeErrorToConn(conn, "Failed to get room")
		conn.Close()
		return
	}
	participantId := dbRoom.ParticipantID
	if participantId.Valid != true {
		writeErrorToConn(conn, "No participant in this room")
		conn.Close()
		return
	}
	if dbRoom.OwnerID.String() != userId.String() && participantId.UUID.String() != userId.String() {
		writeErrorToConn(conn, "You are not the owner or participant of this room")
		conn.Close()
		return
	}
	// check if room has ended
	if dbRoom.EndedAt.Valid || (dbRoom.Status != database.RoomStatusPending && dbRoom.Status != database.RoomStatusLive) {
		writeErrorToConn(conn, "Room has ended")
		conn.Close()
		return
	}
	// check if is owner
	isOwner := dbRoom.OwnerID.String() == userId.String()
	
	room, ok := rooms[roomUUID]
	if !ok {
		room = &room_t{
			id: roomUUID,
			state: state_t{
				started: dbRoom.Status == database.RoomStatusLive,
				ended:   false,
			},
		}
		rooms[roomUUID] = room
	}
	if isOwner {
		if room.owner != nil && room.owner.conn != nil {
			room.owner.conn.Close()
		}
		room.owner = &user_t{
			id:   userId,
			conn: conn,
			send: make(chan message_t, 256),
		}
		go room.owner.writePump()

		// check if call has been started and participant is online
		if room.state.started && room.participant != nil && room.participant.conn != nil {
			writeMessage(message_t{
				Type:    "triggered",
				Payload: nil,
			}, room, true)
			writeMessage(message_t{ Type: "trigger", Payload: nil}, room, false)
		}
	} else {
		// check if call has been started and owner is online
		if room.participant != nil && room.participant.conn != nil {
			room.participant.conn.Close()
		}
		room.participant = &user_t{
			id:   userId,
			conn: conn,
			send: make(chan message_t, 256),
		}
		go room.participant.writePump()
		if room.state.started && room.owner != nil && room.owner.conn != nil {
			writeMessage(message_t{
				Type:    "trigger",
				Payload: nil,
			}, room, false)
			writeMessage(message_t{ Type: "triggered", Payload: nil}, room, true)
		}
	}
	handleConnection(conn, room, isOwner, cfg.DB)

}

func handleConnection(conn *websocket.Conn, room *room_t, isOwner bool, db *database.Queries) {
	offline := func (){
		writeMessage(message_t{
			Type: "user_offline",
			Payload: nil,
		}, room, isOwner)
	}
	defer offline()
	offlineTick := time.AfterFunc(time.Minute * 6, offline)
	for {
		var msg message_t
		err := conn.ReadJSON(&msg)
		if err != nil {
			break
		}
		switch msg.Type {
		case "start":
			if !isOwner {
				fmt.Println("Not owner tried to start call")
				continue
			}

			if room.state.started {
				writeMessage(message_t{
					Type:    "triggered",
					Payload: nil,
				}, room, true)
				writeMessage(message_t{
					Type:    "trigger",
					Payload: nil,
				}, room, false)
				continue
			}

			// start room
			if room.owner == nil {
				fmt.Println("Owner not found")
				continue
			}
			ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
			err := db.StartRoom(ctx, database.StartRoomParams{
				ID:      room.id,
				OwnerID: room.owner.id,
			})
			if err != nil {
				fmt.Println("Failed to update room")
				cancel()
				continue
			}
			cancel()
			writeMessage(message_t{
				Type:    "triggered",
				Payload: nil,
			}, room, true)
			writeMessage(message_t{
				Type:    "trigger",
				Payload: nil,
			}, room, false)

			room.state.started = true

		case "end":
			if !isOwner {
				fmt.Println("Not owner tried to end call")
				continue
			}
			if room.owner == nil {
				fmt.Println("Owner not found")
				continue
			}
			ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
			err := db.EndRoom(ctx, database.EndRoomParams{
				ID:      room.id,
				OwnerID: room.owner.id,
			})
			if err != nil {
				fmt.Println("Failed to end room")
				cancel()
				continue
			}
			cancel()
			writeMessage(message_t{
				Type:    "ended",
				Payload: nil,
			}, room, isOwner)
			writeMessage(message_t{
				Type:    "ended",
				Payload: nil,
			}, room, !isOwner)
			delete(rooms, room.id)
			if room.owner != nil {
				room.owner.conn.Close()
			}
			if room.participant != nil {
				room.participant.conn.Close()
			}
			room.state.ended = true

		case "leave":
			writeMessage(message_t{
				Type: "user_left",
				Payload: nil,
			}, room, isOwner)


		case "online":
			// reset offlineTick and send user_online tick to user
			offlineTick.Reset(time.Minute * 6)
			writeMessage(message_t{
				Type: "user_online",
				Payload: nil,
			}, room, isOwner)

		case "offer":
			fallthrough
		case "answer":
			fallthrough
		case "ice_candidate":
			fallthrough
		case "edit":
			writeMessage(msg, room, isOwner)
		default:
			fmt.Printf("Unknown message type: %s\n", msg.Type)
		}
	}
	conn.Close()
}

func writeMessage(msg message_t, room *room_t, isOwner bool) {
	if isOwner {
		if room.participant != nil {
			room.participant.send <- msg
		}
	} else {
		if room.owner != nil  {
			room.owner.send <- msg
		}
	}
}

// this function should only be used when authenticating the user, it should not be called after writePump
func writeErrorToConn(conn *websocket.Conn, msg string) {
	fmt.Println("Writing error message to conn:", msg)
	err := conn.WriteJSON(message_t{
		Type:    "error",
		Payload: msg,
	})
	if err != nil {
		fmt.Println("Failed to write error message")
	}
}
