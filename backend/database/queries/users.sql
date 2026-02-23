-- name: CreateUserWithEmailPassword :exec
INSERT INTO users (id, email, password, name, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW());

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserById :one
SELECT * FROM users WHERE id = $1;

-- name: SetPendingStatus :exec
UPDATE users SET pending = $1 WHERE id = $2;

-- name: GetPendingStatus :one
SELECT pending FROM users WHERE id = $1;

-- name: CreateUserWithGithub :exec
INSERT INTO users (id, name, email, profile_picture_url, auth, created_at, updated_at) VALUES ($1, $2, $3, $4, 'github', NOW(), NOW());