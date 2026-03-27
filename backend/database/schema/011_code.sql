-- +goose Up
CREATE TYPE language AS ENUM ('python', 'javascript', 'go');
CREATE TABLE code_snippets (
    name TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    room_id UUID NOT NULL,
    code TEXT NOT NULL,
    language language NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id, room_id) REFERENCES questions(id, room_id) ON DELETE CASCADE,
    CONSTRAINT code_snippets_pkey PRIMARY KEY (name, question_id, room_id)
);

-- +goose Down
DROP TABLE code_snippets;
DROP TYPE language;
