-- Convert wid/workspace columns from TEXT to INTEGER.
-- Existing non-numeric values (e.g. 'default') are normalized to 1.

ALTER TABLE "user_profiles"
  ALTER COLUMN "wid" DROP DEFAULT,
  ALTER COLUMN "wid" TYPE INTEGER
  USING (
    CASE
      WHEN "wid" ~ '^[0-9]+$' THEN "wid"::integer
      ELSE 1
    END
  ),
  ALTER COLUMN "wid" SET DEFAULT 1;

ALTER TABLE "booking_event_types"
  ALTER COLUMN "wid" DROP DEFAULT,
  ALTER COLUMN "wid" TYPE INTEGER
  USING (
    CASE
      WHEN "wid" ~ '^[0-9]+$' THEN "wid"::integer
      ELSE 1
    END
  ),
  ALTER COLUMN "wid" SET DEFAULT 1;

ALTER TABLE "scheduled_meetings"
  ALTER COLUMN "wid" DROP DEFAULT,
  ALTER COLUMN "wid" TYPE INTEGER
  USING (
    CASE
      WHEN "wid" ~ '^[0-9]+$' THEN "wid"::integer
      ELSE 1
    END
  ),
  ALTER COLUMN "wid" SET DEFAULT 1;
