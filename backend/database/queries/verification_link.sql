-- name: CreateVerificationLink :exec
INSERT INTO verification_links (user_id, code, expires_at)
VALUES ($1, $2, $3);

-- name: GetVerificationLink :one
SELECT * FROM verification_links WHERE code = $1;

-- name: DeleteVerificationLink :exec
DELETE FROM verification_links WHERE code = $1;

-- name: DeleteVerificationLinksByUserId :exec
DELETE FROM verification_links WHERE user_id = $1;