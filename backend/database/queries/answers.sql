-- name: CreateAnswer :exec
INSERT INTO answers (question_id, room_id, answer)
VALUES ($1, $2, $3);

-- name: GetAnswerByQuestionAndRoomID :one
SELECT * FROM answers WHERE question_id = $1 AND room_id = $2;

-- name: UpdateAnswerByQuestionAndRoomID :one
UPDATE answers
SET answer = $3, updated_at = CURRENT_TIMESTAMP
WHERE question_id = $1 AND room_id = $2
RETURNING *;

-- name: DeleteAnswerByQuestionAndRoomID :exec
DELETE FROM answers WHERE question_id = $1 AND room_id = $2;

-- name: ListAnswersByRoomID :many
SELECT * FROM answers WHERE room_id = $1;