BEGIN;

CREATE TABLE ride_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    passenger_id UUID NOT NULL REFERENCES users(id),

    pickup_area TEXT NOT NULL
        CHECK (length(trim(pickup_area)) > 0),

    destination_area TEXT NOT NULL
        CHECK (length(trim(destination_area)) > 0),

    seats INTEGER NOT NULL CHECK (seats > 0),

    status TEXT NOT NULL DEFAULT 'REQUESTED'
        CHECK (status IN (
            'REQUESTED',
            'MATCHED',
            'DRIVER_ARRIVED',
            'STARTED',
            'COMPLETED',
            'CANCELLED'
        )),

    estimated_fare_paisa INTEGER NOT NULL
        CHECK (estimated_fare_paisa >= 0),

    final_fare_paisa INTEGER
        CHECK (final_fare_paisa >= 0),

    payment_method TEXT NOT NULL DEFAULT 'CASH'
        CHECK (payment_method = 'CASH'),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (pickup_area <> destination_area)
);

CREATE UNIQUE INDEX one_active_request_per_passenger
    ON ride_requests(passenger_id)
    WHERE status IN (
        'REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'
    );

CREATE INDEX ride_requests_status_created_idx
    ON ride_requests(status, created_at);

CREATE INDEX ride_requests_passenger_created_idx
    ON ride_requests(passenger_id, created_at DESC);

COMMIT;