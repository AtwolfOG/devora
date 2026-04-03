-- +goose Up
CREATE TABLE answers (
    question_id INTEGER NOT NULL,
    room_id UUID NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id, room_id) REFERENCES questions(id, room_id) ON DELETE CASCADE,
    CONSTRAINT answers_pkey PRIMARY KEY (question_id, room_id)
);

-- +goose Down
DROP TABLE answers;