-- +goose Up
ALTER TABLE room ADD COLUMN role VARCHAR(100) NOT NULL;
ALTER TABLE room ADD COLUMN company VARCHAR(100) NOT NULL;
ALTER TABLE room ADD COLUMN started_at TIMESTAMP CHECK ( started_at IS NOT NULL OR status = 'pending' OR status = 'cancelled' );
ALTER TABLE room ADD COLUMN ended_at TIMESTAMP CHECK ( ended_at IS NOT NULL OR status = 'pending' OR status = 'live' OR status = 'cancelled' );
CREATE TYPE room_status AS ENUM ( 'pending', 'live', 'reviewing', 'completed', 'cancelled' );
ALTER TABLE room ADD COLUMN status room_status NOT NULL DEFAULT 'pending';

ALTER TABLE room DROP COLUMN name;
ALTER TABLE room DROP COLUMN is_active;

-- +goose Down
ALTER TABLE room DROP COLUMN role;
ALTER TABLE room DROP COLUMN company;

ALTER TABLE room DROP COLUMN started_at;
ALTER TABLE room DROP COLUMN ended_at;
ALTER TABLE room DROP COLUMN status;
DROP TYPE room_status;

ALTER TABLE room ADD COLUMN name VARCHAR(255) NOT NULL;
ALTER TABLE room ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT FALSE;
