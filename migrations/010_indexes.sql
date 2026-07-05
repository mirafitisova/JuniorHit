-- Performance indexes for hot query paths

-- users.zip_code (used in geo queries / court distance)
CREATE INDEX IF NOT EXISTS idx_users_zip_code ON users(zip_code);

-- player_profiles.utr_rating (search filter: WHERE utr_rating BETWEEN x AND y)
CREATE INDEX IF NOT EXISTS idx_player_profiles_utr_rating ON player_profiles(utr_rating);

-- hit_requests: the most-queried table — requester, receiver, and status are all hot
CREATE INDEX IF NOT EXISTS idx_hit_requests_requester  ON hit_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_hit_requests_receiver   ON hit_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_hit_requests_status     ON hit_requests(status);
-- composite for the common "all my requests" query
CREATE INDEX IF NOT EXISTS idx_hit_requests_parties    ON hit_requests(requester_id, receiver_id);
-- composite for re-engagement: completed sessions per user
CREATE INDEX IF NOT EXISTS idx_hit_requests_completed  ON hit_requests(requester_id, status) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_hit_requests_completed2 ON hit_requests(receiver_id,  status) WHERE status = 'completed';

-- weekly_availability.user_id (if not already present from migration 001)
CREATE INDEX IF NOT EXISTS idx_weekly_availability_user_id ON weekly_availability(user_id);

-- favorites (prevent duplicates, enable fast lookup)
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique ON favorites(user_id, favorite_user_id);
CREATE INDEX       IF NOT EXISTS idx_favorites_user    ON favorites(user_id);
