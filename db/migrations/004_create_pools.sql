BEGIN;

CREATE TABLE pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vehicle_id UUID NOT NULL REFERENCES vehicles(id),

    status TEXT NOT NULL DEFAULT 'MATCHED'
        CHECK (status IN (
            'MATCHED',
            'DRIVER_ARRIVED',
            'STARTED',
            'COMPLETED',
            'CANCELLED'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX one_active_pool_per_vehicle
    ON pools(vehicle_id)
    WHERE status IN ('MATCHED', 'DRIVER_ARRIVED', 'STARTED');

CREATE INDEX pools_vehicle_created_idx
    ON pools(vehicle_id, created_at DESC);

CREATE TABLE pool_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    pool_id UUID NOT NULL REFERENCES pools(id),

    request_id UUID NOT NULL UNIQUE REFERENCES ride_requests(id),

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX pool_memberships_pool_idx
    ON pool_memberships(pool_id);

COMMIT;