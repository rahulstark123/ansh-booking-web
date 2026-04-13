-- Add wid/workspace filter column to user profile and booking tables.
ALTER TABLE "user_profiles" ADD COLUMN "wid" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "booking_event_types" ADD COLUMN "wid" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "scheduled_meetings" ADD COLUMN "wid" TEXT NOT NULL DEFAULT 'default';

CREATE INDEX "booking_event_types_wid_hostId_idx" ON "booking_event_types"("wid", "hostId");
CREATE INDEX "scheduled_meetings_wid_hostId_idx" ON "scheduled_meetings"("wid", "hostId");
CREATE INDEX "scheduled_meetings_wid_hostId_startsAt_idx" ON "scheduled_meetings"("wid", "hostId", "startsAt");
