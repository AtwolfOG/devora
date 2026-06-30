package room

import "time"

// NullUUID represents a nullable UUID for Swagger docs
type NullUUID struct {
	UUID  string `json:"uuid"`
	Valid bool   `json:"valid"`
}

// NullTime represents a nullable time for Swagger docs
type NullTime struct {
	Time  string `json:"time"`
	Valid bool   `json:"valid"`
}

// NullString represents a nullable string for Swagger docs
type NullString struct {
	String string `json:"string"`
	Valid  bool   `json:"valid"`
}

// NullBool represents a nullable bool for Swagger docs
type NullBool struct {
	Bool  bool `json:"bool"`
	Valid bool `json:"valid"`
}

// RoomDTO represents a database room in the API responses
type RoomDTO struct {
	ID            string    `json:"id"`
	Description   string    `json:"description"`
	OwnerID       string    `json:"owner_id"`
	StartTime     time.Time `json:"start_time"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	ParticipantID NullUUID  `json:"participant_id"`
	Role          string    `json:"role"`
	Company       string    `json:"company"`
	Status        string    `json:"status"`
	StartedAt     NullTime  `json:"started_at"`
	EndedAt       NullTime  `json:"ended_at"`
	Feedback      NullString `json:"feedback"`
	Passed        NullBool  `json:"passed"`
}

// RoomDetailsResponseDTO represents the response from GetRoomByID
type RoomDetailsResponseDTO struct {
	RoomDTO
	IsOwner       bool `json:"is_owner"`
	IsParticipant bool `json:"is_participant"`
}

// AnswerDTO represents a question answer in the API responses
type AnswerDTO struct {
	QuestionID int32     `json:"question_id"`
	RoomID     string    `json:"room_id"`
	Answer     string    `json:"answer"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// CodeSnippetDTO represents a code snippet in the API responses
type CodeSnippetDTO struct {
	Name       string    `json:"name"`
	QuestionID int32     `json:"question_id"`
	RoomID     string    `json:"room_id"`
	Code       string    `json:"code"`
	Language   string    `json:"language"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
