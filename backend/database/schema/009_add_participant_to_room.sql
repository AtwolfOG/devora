-- +goose Up
ALTER TABLE room ADD COLUMN participant_id UUID NOT NULL;
ALTER TABLE room ADD CONSTRAINT fk_room_participant FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE CASCADE;

-- +goose Down
ALTER TABLE room DROP CONSTRAINT fk_room_participant;
ALTER TABLE room DROP COLUMN participant_id;