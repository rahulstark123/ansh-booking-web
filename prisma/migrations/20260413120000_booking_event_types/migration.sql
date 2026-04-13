-- CreateEnum
CREATE TYPE "BookingEventKind" AS ENUM ('ONE_ON_ONE', 'GROUP', 'ROUND_ROBIN');

-- CreateTable
CREATE TABLE "booking_event_types" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_week_slots" (
    "id" UUID NOT NULL,
    "eventTypeId" UUID NOT NULL,
    "dayKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "booking_week_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_event_types_hostId_idx" ON "booking_event_types"("hostId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_week_slots_eventTypeId_dayKey_key" ON "booking_week_slots"("eventTypeId", "dayKey");

-- AddForeignKey
ALTER TABLE "booking_event_types" ADD CONSTRAINT "booking_event_types_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_week_slots" ADD CONSTRAINT "booking_week_slots_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "booking_event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
