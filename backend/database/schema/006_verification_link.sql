-- +goose Up
CREATE TABLE verification_links (
    user_id UUID NOT NULL,
    code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, code),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- +goose Down
DROP TABLE verification_links;