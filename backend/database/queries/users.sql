-- name: CreateUser :one
INSERT INTO users (email, name, verified) VALUES ($1, $2, $3)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- name: GetUsersByEmail :many
SELECT * FROM users WHERE email = $1;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserById :one
SELECT * FROM users WHERE id = $1;

-- name: CheckUserExists :one
SELECT EXISTS(SELECT 1 FROM users WHERE email = $1);

-- name: GetUnverifiedUserByEmail :one
SELECT * FROM users WHERE email = $1 AND verified = FALSE;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: VerifyUser :exec
UPDATE users SET verified = TRUE WHERE id = $1;