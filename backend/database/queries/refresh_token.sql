-- name: CreateRefreshToken :exec
INSERT INTO refresh_token (token, user_id) VALUES ($1, $2);

-- name: GetRefreshToken :one
SELECT * FROM refresh_token WHERE token = $1;

-- name: DeleteRefreshToken :exec
DELETE FROM refresh_token WHERE token = $1;

-- name: DeleteRefreshTokenByUserId :exec
DELETE FROM refresh_token WHERE user_id = $1;