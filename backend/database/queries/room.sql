-- name: GetRoomByID :one
SELECT * FROM room WHERE id = $1;

-- name: GetRoomsByOwnerID :many
SELECT * FROM room WHERE owner_id = $1;

-- name: GetRoomsByParticipantID :many
SELECT * FROM room WHERE participant_id = $1;

-- name: GetRoomsByOwnerIDAndStatus :many
SELECT * FROM room WHERE owner_id = $1 AND status = ANY($2::room_status[]);

-- name: GetRoomsByParticipantIDAndStatus :many
SELECT * FROM room WHERE participant_id = $1 AND status = ANY($2::room_status[]);

-- name: GetRoomsByOwnerIDOrParticipantIDAndStatus :many
SELECT * FROM room WHERE (owner_id = $1 OR participant_id = $1) AND status = ANY($2::room_status[]);

-- name: GetRoomsByOwnerIDOrParticipantID :many
SELECT * FROM room WHERE (owner_id = $1 OR participant_id = $1);

-- name: CreateRoom :exec
INSERT INTO room (role, company, description, owner_id, start_time) VALUES ($1, $2, $3, $4, $5);

-- name: UpdateRoom :exec
UPDATE room SET role = $1, company = $2, description = $3, start_time = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND owner_id = $6;

-- name: DeleteRoom :exec
DELETE FROM room WHERE id = $1 AND owner_id = $2;

-- name: JoinRoom :exec
UPDATE room SET participant_id = $2 WHERE id = $1;

-- name: StartRoom :exec
UPDATE room SET status = 'live', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending' AND owner_id = $2;

-- name: EndRoom :exec
UPDATE room SET status = 'reviewing', ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'live' AND owner_id = $2;

-- name: CancelRoom :exec
UPDATE room SET status = 'cancelled', ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending' AND owner_id = $2;

-- name: RemoveParticipant :exec
UPDATE room SET participant_id = NULL WHERE id = $1 AND participant_id = $2;


-- name: ListRooms :many
SELECT * FROM room;
