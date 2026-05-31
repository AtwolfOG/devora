-- name: GetRoomByID :one
SELECT * FROM room WHERE id = $1;

-- name: GetRoomsByOwnerID :many
SELECT * FROM room WHERE owner_id = $1 ORDER BY start_time ASC LIMIT $2 OFFSET $3;

-- name: GetRoomsByParticipantID :many
SELECT * FROM room WHERE participant_id = $1 ORDER BY start_time ASC LIMIT $2 OFFSET $3;

-- name: GetRoomsByOwnerIDAndStatus :many
SELECT * FROM room WHERE owner_id = $1 AND status = ANY($2::room_status[]) ORDER BY start_time ASC LIMIT $3 OFFSET $4;

-- name: GetRoomsByParticipantIDAndStatus :many
SELECT * FROM room WHERE participant_id = $1 AND status = ANY($2::room_status[]) ORDER BY start_time ASC LIMIT $3 OFFSET $4;

-- name: GetRoomsByOwnerIDOrParticipantIDAndStatus :many
SELECT * FROM room WHERE (owner_id = $1 OR participant_id = $1) AND status = ANY($2::room_status[]) ORDER BY start_time ASC LIMIT $3 OFFSET $4;

-- name: GetRoomsByOwnerIDOrParticipantID :many
SELECT * FROM room WHERE (owner_id = $1 OR participant_id = $1) ORDER BY start_time ASC LIMIT $2 OFFSET $3;

-- name: GetRoomCountByStatus :one
SELECT COUNT(*) FROM room WHERE (owner_id = $1 OR participant_id = $1) AND status = ANY($2::room_status[]);

-- name: GetPassRate :one
SELECT COALESCE( ROUND( AVG( CASE WHEN passed = true THEN 1.0 ELSE 0.0 END) * 100, 2), 0.0)::float8 as pass_rate from room WHERE participant_id = $1 AND status = 'completed';

-- name: CreateRoom :exec
INSERT INTO room (role, company, description, owner_id, start_time) VALUES ($1, $2, $3, $4, $5);

-- name: UpdateRoom :exec
UPDATE room SET role = $1, company = $2, description = $3, start_time = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND owner_id = $6 AND status = 'pending';

-- name: DeleteRoom :exec
DELETE FROM room WHERE id = $1 AND owner_id = $2 AND status = 'pending';

-- name: AddParticipantToRoom :exec
UPDATE room SET participant_id = $2 WHERE id = $1 AND status = 'pending';

-- name: StartRoom :exec
UPDATE room SET status = 'live', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending' AND owner_id = $2;

-- name: EndRoom :exec
UPDATE room SET status = 'reviewing', ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'live' AND owner_id = $2;

-- name: CancelRoom :exec
UPDATE room SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending' AND owner_id = $2;

-- name: RemoveParticipantFromRoom :exec
UPDATE room SET participant_id = NULL WHERE id = $1;

-- name: RescheduleRoom :exec
UPDATE room SET start_time = $2, status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND owner_id = $3 AND status = 'cancelled';

-- name: SubmitFeedback :exec
UPDATE room SET feedback = $1, passed = $2, status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND status = 'reviewing' AND owner_id = $4;

-- name: ListRooms :many
SELECT * FROM room;
