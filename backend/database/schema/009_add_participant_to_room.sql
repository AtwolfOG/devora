-- +goose Up
ALTER TABLE room ADD COLUMN participant_id UUID CHECK (participant_id != owner_id);
ALTER TABLE room ADD CONSTRAINT fk_room_participant FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_room_participant ON room(participant_id);

-- +goose Down
ALTER TABLE room DROP CONSTRAINT fk_room_participant;
ALTER TABLE room DROP COLUMN participant_id;
ALTER TABLE room DROP INDEX idx_room_participant;