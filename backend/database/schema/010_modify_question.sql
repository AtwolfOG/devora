-- +goose Up
ALTER TABLE questions ADD COLUMN answer TEXT;
ALTER TABLE questions ADD COLUMN title TEXT NOT NULL;
ALTER TABLE questions ADD COLUMN description TEXT NOT NULL;
ALTER TABLE questions DROP COLUMN question;
ALTER TABLE questions DROP COLUMN passed;
ALTER TABLE questions ADD COLUMN is_code BOOLEAN DEFAULT FALSE NOT NULL;

-- +goose Down
ALTER TABLE questions DROP COLUMN answer;
ALTER TABLE questions DROP COLUMN title;
ALTER TABLE questions DROP COLUMN description;
ALTER TABLE questions ADD COLUMN question TEXT NOT NULL;
ALTER TABLE questions ADD COLUMN passed BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE questions DROP COLUMN is_code;
