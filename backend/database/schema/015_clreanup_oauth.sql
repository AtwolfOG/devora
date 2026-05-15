-- +goose Up
DROP TABLE github_oauth;
ALTER TABLE users DROP COLUMN pending;
ALTER TABLE users DROP COLUMN auth;
DROP TYPE auth_type;
ALTER TABLE users DROP COLUMN password;

ALTER TABLE users ADD COLUMN verified BOOLEAN NOT NULL;

-- +goose Down
CREATE TABLE github_oauth (
    github_id INTEGER NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE users ADD COLUMN pending BOOLEAN DEFAULT TRUE;
CREATE TYPE auth_type AS ENUM ('email', 'github', 'none');
ALTER TABLE users ADD COLUMN auth auth_type NOT NULL DEFAULT 'none';
ALTER TABLE users ADD COLUMN password TEXT;

ALTER TABLE users DROP COLUMN verified;