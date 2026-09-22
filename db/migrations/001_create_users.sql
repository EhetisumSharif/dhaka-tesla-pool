CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL
        CHECK (length(trim(name)) >= 2),

    email VARCHAR(254) NOT NULL UNIQUE
        CHECK (email = lower(trim(email))),

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL DEFAULT 'PASSENGER'
        CHECK (role IN ('PASSENGER', 'DRIVER')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);