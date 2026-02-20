-- name: CreateUserWithEmailPassword :exec
INSERT INTO users (id, email, password, name, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW());