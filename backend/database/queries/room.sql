-- name: GetRoomByID :one
SELECT * FROM room WHERE id = $1;

-- name: GetRoomByName :one
SELECT * FROM room WHERE name = $1;

-- name: GetRoomsByOwnerID :many
SELECT * FROM room WHERE owner_id = $1;

-- name: CreateRoom :exec
INSERT INTO room (id, name, description, owner_id, start_time) VALUES ($1, $2, $3, $4, $5);

-- name: UpdateRoom :exec
UPDATE room SET name = $1, description = $2, start_time = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4;

-- name: DeleteRoom :exec
DELETE FROM room WHERE id = $1;

-- name: ListRooms :many
SELECT * FROM room;
