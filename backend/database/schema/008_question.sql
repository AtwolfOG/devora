-- +goose Up
CREATE TABLE questions (
    id SERIAL,
    room_id UUID NOT NULL,
    question TEXT NOT NULL,
    done BOOLEAN DEFAULT FALSE NOT NULL,
    passed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
    CONSTRAINT questions_pkey PRIMARY KEY (id, room_id )
);

-- +goose Down
DROP TABLE questions;