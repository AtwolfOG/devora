-- name: CreateGithubOauth :exec
INSERT INTO github_oauth (
    user_id,
    github_id
) VALUES ($1, $2);

-- name: GetGithubOauthByGithubId :one
SELECT * FROM github_oauth WHERE github_id = $1;

-- name: GetGithubOauthByUserId :one
SELECT * FROM github_oauth WHERE user_id = $1;
