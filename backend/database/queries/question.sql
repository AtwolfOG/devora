-- name: CreateQuestion :exec
INSERT INTO question (room_id, question) VALUES ($1, $2);

-- name: GetQuestionByID :one
SELECT * FROM question WHERE id = $1;

-- name: GetQuestionsByRoomID :many
SELECT * FROM question WHERE room_id = $1;

-- name: UpdateQuestion :exec
UPDATE question SET question = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;

-- name: DeleteQuestion :exec
DELETE FROM question WHERE id = $1 AND room_id = $2;

-- name: ListQuestions :many
SELECT * FROM question;