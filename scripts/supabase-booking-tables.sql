-- Run in Supabase SQL Editor (idempotent where noted). Aligns with prisma/schema.prisma booking models.
-- After apply: `npx prisma generate` (migrations may use `prisma migrate resolve` if applied manually).

DO $$
BEGIN
  CREATE TYPE "BookingEventKind" AS ENUM ('ONE_ON_ONE', 'GROUP', 'ROUND_ROBIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "booking_event_types" (
  "id" UUID NOT NULL,
  "hostId" UUID NOT NULL,
  "kind" "BookingEventKind" NOT NULL,
  "eventName" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "location" TEXT NOT NULL,
  "description" TEXT,
  "availabilityPreset" TEXT NOT NULL,
  "minNotice" TEXT NOT NULL,
  "bufferBeforeMinutes" INTEGER NOT NULL,
  "bufferAfterMinutes" INTEGER NOT NULL,
  "bookingWindow" TEXT NOT NULL,
  "bookingQuestion" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_event_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "booking_week_slots" (
  "id" UUID NOT NULL,
  "eventTypeId" UUID NOT NULL,
  "dayKey" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  CONSTRAINT "booking_week_slots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "booking_event_types_hostId_idx" ON "booking_event_types" ("hostId");
CREATE UNIQUE INDEX IF NOT EXISTS "booking_week_slots_eventTypeId_dayKey_key" ON "booking_week_slots" ("eventTypeId", "dayKey");

DO $$
BEGIN
  ALTER TABLE "booking_event_types" ADD CONSTRAINT "booking_event_types_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "booking_week_slots" ADD CONSTRAINT "booking_week_slots_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "booking_event_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
