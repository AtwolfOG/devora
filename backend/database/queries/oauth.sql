-- name: CreateGoogleOauth :exec
INSERT INTO oauth (
    provider,
    user_id,
    provider_id,
    email
) VALUES ('google', $1, $2, $3);

-- name: CreateGithubOauth :exec
INSERT INTO oauth (
    provider,
    user_id,
    provider_id,
    email
) VALUES ('github', $1, $2, $3);

-- name: CreateEmailOauth :exec
INSERT INTO oauth (
    provider,
    user_id,
    email,
    password
) VALUES ('email', $1, $2, $3);

-- name: GetUserByProviderId :one
SELECT u.id as userID, u.name as userName, u.email as userEmail
FROM users u
JOIN oauth o ON u.id = o.user_id
WHERE o.provider = $1 AND o.provider_id = $2 AND u.verified = TRUE;

-- name: GetOauthProvidersByUserId :many
SELECT provider, provider_id, email, created_at, updated_at FROM oauth WHERE user_id = $1;

-- name: GetOauthEmailByProviderId :one
SELECT email FROM oauth WHERE provider = $1 AND provider_id = $2;

-- name: GetOauthByEmailAndProvider :one
SELECT * FROM oauth WHERE email = $1 AND provider = $2;

-- name: GetOauthByUserIdAndProvider :one
SELECT * FROM oauth WHERE user_id = $1 AND provider = $2;

-- name: DeleteOauthByUserIdAndProvider :exec
DELETE FROM oauth WHERE user_id = $1 AND provider = $2;

-- name: UpdateOauthPassword :exec
UPDATE oauth SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND provider = 'email';
