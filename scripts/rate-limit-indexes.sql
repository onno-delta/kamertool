-- Unique partial indexes for atomic rate limiting (INSERT ... ON CONFLICT)
-- Required by the atomicUpsert function in lib/rate-limit.ts

CREATE UNIQUE INDEX IF NOT EXISTS usage_log_user_date
  ON usage_log ("userId", "date")
  WHERE "userId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS usage_log_session_date
  ON usage_log ("sessionId", "date")
  WHERE "sessionId" IS NOT NULL;
