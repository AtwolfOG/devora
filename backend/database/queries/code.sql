-- name: CreateCode :one
INSERT INTO code_snippets (name, question_id, code, language)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetCode :one
SELECT * FROM code_snippets WHERE name = $1 AND question_id = $2;

-- name: UpdateCode :one
UPDATE code_snippets
SET code = $3, updated_at = CURRENT_TIMESTAMP
WHERE name = $1 AND question_id = $2
RETURNING *;

-- name: DeleteCode :exec
DELETE FROM code_snippets WHERE name = $1 AND question_id = $2;

-- name: ListCodes :many
SELECT * FROM code_snippets WHERE question_id = $1;