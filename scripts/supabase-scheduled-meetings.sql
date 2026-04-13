-- Optional: run after booking_event_types exists. Idempotent helpers.

DO $$
BEGIN
  CREATE TYPE "ScheduledMeetingStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "scheduled_meetings" (
  "id" UUID NOT NULL,
  "hostId" UUID NOT NULL,
  "eventTypeId" UUID,
  "title" TEXT NOT NULL,
  "eventTypeLabel" TEXT NOT NULL,
  "guestName" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "status" "ScheduledMeetingStatus" NOT NULL DEFAULT 'UPCOMING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scheduled_meetings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "scheduled_meetings_hostId_idx" ON "scheduled_meetings" ("hostId");
CREATE INDEX IF NOT EXISTS "scheduled_meetings_hostId_startsAt_idx" ON "scheduled_meetings" ("hostId", "startsAt");

DO $$
BEGIN
  ALTER TABLE "scheduled_meetings" ADD CONSTRAINT "scheduled_meetings_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "scheduled_meetings" ADD CONSTRAINT "scheduled_meetings_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "booking_event_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
