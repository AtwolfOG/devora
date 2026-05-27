-- name: CreateCode :exec
INSERT INTO code_snippets (name, question_id, room_id, code, language)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (name, question_id, room_id)
DO UPDATE SET
    code = $4,
    updated_at = CURRENT_TIMESTAMP;

-- name: GetCodeByQuestionAndRoomIDAndName :one
SELECT * FROM code_snippets WHERE question_id = $1 AND room_id = $2 AND name = $3;

-- name: UpdateCode :one
UPDATE code_snippets
SET code = $3, updated_at = CURRENT_TIMESTAMP
WHERE name = $1 AND question_id = $2 AND room_id = $3
RETURNING *;

-- name: DeleteCode :exec
DELETE FROM code_snippets WHERE name = $1 AND question_id = $2;

-- name: ListCodes :many
SELECT * FROM code_snippets WHERE question_id = $1;