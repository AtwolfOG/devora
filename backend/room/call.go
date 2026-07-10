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
	joinPayload := msg.Payload.(map[string]interface{})
	accessToken, ok := joinPayload["access_token"].(string)
	if !ok {
		writeErrorToConn(conn, "Invalid access token")
		conn.Close()
		return
	}
	isOwnerClaim, ok := joinPayload["is_owner"].(bool)
	if !ok {
		writeErrorToConn(conn, "Invalid is owner")
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
	// check if is owner claim matches
	if isOwner != isOwnerClaim {
		writeErrorToConn(conn, "Invalid request")
		conn.Close()
		return
	}
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
		if room.owner.conn != nil {
			room.owner.conn.Close()
		}
		room.owner = &user_t{
			id:   userId,
			conn: conn,
		}
	} else {
		if room.participant.conn != nil {
			room.participant.conn.Close()
		}
		room.participant = &user_t{
			id:   userId,
			conn: conn,
		}
	}
	handleConnection(conn, room, isOwner, cfg.DB)

}

func handleConnection(conn *websocket.Conn, room *room_t, isOwner bool, db *database.Queries) {
	for {
		var msg message_t
		err := conn.ReadJSON(&msg)
		if err != nil {
			break
		}
		switch msg.Type {
		case "start":
			if room.state.started {
				writeMessage(message_t{
					Type:    "started",
					Payload: nil,
				}, room, isOwner)
				// writeMessage(message_t{
				// 	Type:    "started",
				// 	Payload: nil,
				// }, room, !isOwner)
				// continue
			}
			if !isOwner {
				fmt.Println("Not owner tried to start call")
				continue
			}

			// start room
			ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
			defer cancel()
			err := db.StartRoom(ctx, database.StartRoomParams{
				ID:      room.id,
				OwnerID: room.owner.id,
			})
			if err != nil {
				fmt.Println("Failed to update room")
				continue
			}
			writeMessage(message_t{
				Type:    "started",
				Payload: nil,
			}, room, isOwner)
			// writeMessage(message_t{
			// 	Type:    "started",
			// 	Payload: nil,
			// }, room, !isOwner)

			room.state.started = true

		case "end":
			if !isOwner {
				fmt.Println("Not owner tried to end call")
				continue
			}
			ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
			defer cancel()
			err := db.EndRoom(ctx, database.EndRoomParams{
				ID:      room.id,
				OwnerID: room.owner.id,
			})
			if err != nil {
				fmt.Println("Failed to end room")
				continue
			}
			writeMessage(message_t{
				Type:    "ended",
				Payload: nil,
			}, room, isOwner)
			writeMessage(message_t{
				Type:    "ended",
				Payload: nil,
			}, room, !isOwner)
			delete(rooms, room.id)
			room.owner.conn.Close()
			room.participant.conn.Close()
			room.state.ended = true

		case "join":
			

		case "offer":
			fallthrough
		case "answer":
			fallthrough
		case "candidate":
			fallthrough
		case "leave":
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
		if room.participant.conn != nil {
			err := room.participant.conn.WriteJSON(msg)
			if err != nil {
				fmt.Println("Failed to write message")
			}
		}
	} else {
		if room.owner.conn != nil {
			err := room.owner.conn.WriteJSON(msg)
			if err != nil {
				fmt.Println("Failed to write message")
			}
		}
	}
}

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
