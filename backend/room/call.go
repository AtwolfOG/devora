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
	roomId := r.URL.Query().Get("roomId")
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
		lib.WriteError(w, http.StatusBadRequest, "Invalid message type")
		return
	}

	// get access token from first message
	joinPayload := msg.Payload.(map[string]interface{})
	accessToken, ok := joinPayload["access_token"].(string)
	if !ok {
		lib.WriteError(w, http.StatusBadRequest, "Invalid access token")
		return
	}
	isOwnerClaim, ok := joinPayload["is_owner"].(bool)
	if !ok {
		lib.WriteError(w, http.StatusBadRequest, "Invalid is owner")
		return
	}

	user, err := auth.VerifyJWT(accessToken, cfg.JWTSecret)
	if err != nil {
		lib.WriteError(w, http.StatusUnauthorized, "Invalid access token")
		return
	}

	userId, err := uuid.Parse(user.Id)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to parse user id")
		return
	}

	dbRoom, err := cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		lib.WriteError(w, http.StatusInternalServerError, "Failed to get room")
		return
	}
	participantId := dbRoom.ParticipantID
	if participantId.Valid != true {
		lib.WriteError(w, http.StatusBadRequest, "No participant in this room")
		return
	}
	if dbRoom.OwnerID.String() != userId.String() && participantId.UUID.String() != userId.String() {
		lib.WriteError(w, http.StatusUnauthorized, "You are not the owner or participant of this room")
		return
	}
	// check if room has ended
	if dbRoom.EndedAt.Valid || (dbRoom.Status != database.RoomStatusPending && dbRoom.Status != database.RoomStatusLive) {
		lib.WriteError(w, http.StatusGone, "Room has ended")
		return
	}
	// check if is owner
	isOwner := dbRoom.OwnerID.String() == userId.String()
	// check if is owner claim matches
	if isOwner != isOwnerClaim {
		lib.WriteError(w, http.StatusUnauthorized, "Invalid request")
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
				writeMessage(message_t{
					Type:    "started",
					Payload: nil,
				}, room, !isOwner)
				continue
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
			writeMessage(message_t{
				Type:    "started",
				Payload: nil,
			}, room, !isOwner)

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

		case "offer":
			fallthrough
		case "answer":
			fallthrough
		case "candidate":
			fallthrough
		case "join":
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
			room.participant.conn.WriteJSON(msg)
		}
	} else {
		if room.owner.conn != nil {
			room.owner.conn.WriteJSON(msg)
		}
	}
}
