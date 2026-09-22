CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    driver_id UUID NOT NULL UNIQUE REFERENCES users(id),

    name VARCHAR(100) NOT NULL
        CHECK (length(trim(name)) >= 1),

    capacity INTEGER NOT NULL
        CHECK (capacity > 0),

    is_online BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);