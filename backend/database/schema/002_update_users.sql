-- +goose Up
ALTER TABLE users ADD COLUMN password TEXT;
ALTER TABLE users ADD CONSTRAINT email_unique UNIQUE (email);

-- +goose Down
ALTER TABLE users DROP COLUMN password;
ALTER TABLE users DROP CONSTRAINT email_unique;