-- +goose Up
ALTER TABLE users ADD COLUMN pending BOOLEAN DEFAULT TRUE;
ALTER TABLE users ALTER COLUMN name SET NOT NULL;
ALTER TABLE users ADD COLUMN profile_picture_url TEXT NOT NULL DEFAULT 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
CREATE TYPE auth_type AS ENUM ('email', 'github', 'none');
ALTER TABLE users ADD COLUMN auth auth_type NOT NULL DEFAULT 'none';

-- +goose Down
ALTER TABLE users DROP COLUMN pending;
ALTER TABLE users DROP constraint not_null_name;
ALTER TABLE users DROP COLUMN profile_picture_url;
ALTER TABLE users DROP COLUMN auth;
DROP TYPE auth_type;