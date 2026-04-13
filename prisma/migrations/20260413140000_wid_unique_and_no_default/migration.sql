-- Ensure wid is unique per profile and stop defaulting every row to 1.
-- Normalize existing profiles to unique sequential wid values.

WITH numbered AS (
  SELECT
    id,
    row_number() OVER (ORDER BY "createdAt", id) AS next_wid
  FROM "user_profiles"
)
UPDATE "user_profiles" u
SET "wid" = n.next_wid
FROM numbered n
WHERE u.id = n.id;

-- Keep child tables aligned to host profile wid.
UPDATE "booking_event_types" b
SET "wid" = u."wid"
FROM "user_profiles" u
WHERE b."hostId" = u.id;

UPDATE "scheduled_meetings" s
SET "wid" = u."wid"
FROM "user_profiles" u
WHERE s."hostId" = u.id;

ALTER TABLE "user_profiles" ALTER COLUMN "wid" DROP DEFAULT;
ALTER TABLE "booking_event_types" ALTER COLUMN "wid" DROP DEFAULT;
ALTER TABLE "scheduled_meetings" ALTER COLUMN "wid" DROP DEFAULT;

CREATE UNIQUE INDEX "user_profiles_wid_key" ON "user_profiles"("wid");
