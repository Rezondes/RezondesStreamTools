-- Data database of RST. Kept to plain, portable SQL (SQLite now, PostgreSQL later). Everything about a streamer is
-- encrypted with their data key before it gets here; the database sees only ciphertext and lookup HMACs.

-- Streamers: found by HMAC of the Twitch user ID or the login (key derived from the master key), never by plaintext
CREATE TABLE streamers (
    id TEXT PRIMARY KEY NOT NULL,
    user_id_hmac BLOB NOT NULL UNIQUE,
    login_hmac BLOB NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
);

-- Encrypted blocks per streamer, kind (e.g. settings, triggers) and key (empty for single values)
CREATE TABLE records (
    streamer_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    record_key TEXT NOT NULL,
    ciphertext BLOB NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (streamer_id, kind, record_key)
);

-- Dashboard sessions: only the SHA-256 of the token
CREATE TABLE sessions (
    token_hash BLOB PRIMARY KEY NOT NULL,
    streamer_id TEXT NOT NULL REFERENCES streamers (id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_by_streamer ON sessions (streamer_id);

-- Append-only audit log; entries of a streamer are encrypted with their key, server-wide ones (streamer_id NULL)
-- with a key derived from the master key
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    streamer_id TEXT,
    created_at INTEGER NOT NULL,
    ciphertext BLOB NOT NULL
);
CREATE INDEX audit_log_by_streamer ON audit_log (streamer_id, id);

-- Server-wide settings (access policy, backup schedule), encrypted with a key derived from the master key
CREATE TABLE server_settings (
    setting_key TEXT PRIMARY KEY NOT NULL,
    ciphertext BLOB NOT NULL,
    updated_at INTEGER NOT NULL
);
