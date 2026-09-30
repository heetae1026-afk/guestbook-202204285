CREATE TABLE IF NOT EXISTS entries (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          varchar(20)  NOT NULL,
  message       varchar(500) NOT NULL,
  password_hash text         NOT NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz
);

CREATE INDEX IF NOT EXISTS entries_created_at_idx ON entries (created_at DESC, id DESC);
