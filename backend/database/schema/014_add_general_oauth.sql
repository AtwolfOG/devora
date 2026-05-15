-- +goose Up
CREATE TYPE oauth_provider AS ENUM ('github', 'google', 'email');

CREATE TABLE oauth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider oauth_provider NOT NULL CHECK (provider IN ('github', 'google', 'email')),
    provider_id TEXT CHECK (provider = 'email' OR provider_id IS NOT NULL),
    email TEXT NOT NULL,
    password TEXT CHECK (provider != 'email' OR password IS NOT NULL),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider, provider_id),
    UNIQUE(provider, user_id),
    CHECK (
        (provider = 'email' AND provider_id IS NULL AND password IS NOT NULL) OR
        (provider = 'google' AND provider_id IS NOT NULL AND password IS NULL) OR
        (provider = 'github' AND provider_id IS NOT NULL AND password IS NULL)
    )
);

-- +goose Down
DROP TABLE oauth;
DROP TYPE IF EXISTS oauth_provider;