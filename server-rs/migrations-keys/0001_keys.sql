-- Key store (keys.db, separate from the data database): one data key per streamer, wrapped with the master key
-- (nonce and ciphertext, the streamer ID as associated data). Deleting a row makes the streamer's data unreadable.
CREATE TABLE data_keys (
    streamer_id TEXT PRIMARY KEY NOT NULL,
    wrapped BLOB NOT NULL,
    created_at INTEGER NOT NULL
);
