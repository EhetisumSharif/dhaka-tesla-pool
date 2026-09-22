BEGIN;

CREATE TABLE ride_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id UUID REFERENCES ride_requests(id),
    pool_id UUID REFERENCES pools(id),
    actor_id UUID REFERENCES users(id),

    event_type TEXT NOT NULL
        CHECK (event_type IN (
            'REQUESTED',
            'MATCHED',
            'DRIVER_ARRIVED',
            'STARTED',
            'COMPLETED',
            'CANCELLED',
            'FARE_UPDATED'
        )),

    details JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(details) = 'object'),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (request_id IS NOT NULL OR pool_id IS NOT NULL)
);

CREATE INDEX ride_events_request_created_idx
    ON ride_events(request_id, created_at);

CREATE INDEX ride_events_pool_created_idx
    ON ride_events(pool_id, created_at);

COMMIT;