-- +goose Up
CREATE TABLE refresh_token (
    token TEXT NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- +goose Down
DROP TABLE refresh_token;