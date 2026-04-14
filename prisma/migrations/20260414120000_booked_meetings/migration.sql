-- CreateTable
CREATE TABLE "booked_meetings" (
    "id" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "wid" INTEGER NOT NULL,
    "eventTypeId" UUID NOT NULL,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestNotes" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledMeetingStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booked_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booked_meetings_hostId_idx" ON "booked_meetings"("hostId");

-- CreateIndex
CREATE INDEX "booked_meetings_wid_hostId_idx" ON "booked_meetings"("wid", "hostId");

-- CreateIndex
CREATE INDEX "booked_meetings_eventTypeId_startsAt_idx" ON "booked_meetings"("eventTypeId", "startsAt");

-- CreateIndex
CREATE INDEX "booked_meetings_hostId_startsAt_idx" ON "booked_meetings"("hostId", "startsAt");

-- AddForeignKey
ALTER TABLE "booked_meetings" ADD CONSTRAINT "booked_meetings_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booked_meetings" ADD CONSTRAINT "booked_meetings_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "booking_event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
