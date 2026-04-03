-- +goose Up
ALTER TABLE questions DROP COLUMN answer;

-- +goose Down
ALTER TABLE questions ADD COLUMN answer TEXT;