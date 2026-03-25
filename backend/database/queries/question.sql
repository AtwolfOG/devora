-- name: CreateQuestion :exec
INSERT INTO questions (room_id, title, description, is_code) VALUES ($1, $2, $3, $4);

-- name: GetQuestionByID :one
SELECT * FROM questions WHERE id = $1 AND room_id = $2;

-- name: GetQuestionsByRoomID :many
SELECT * FROM questions WHERE room_id = $1;

-- name: UpdateQuestion :exec
UPDATE questions SET title = $1, description = $2, is_code = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND room_id = $5;

-- name: DeleteQuestion :exec
DELETE FROM questions WHERE id = $1 AND room_id = $2;

-- name: ListQuestions :many
SELECT * FROM questions WHERE room_id = $1;