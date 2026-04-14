-- AlterTable
ALTER TABLE "scheduled_meetings"
ADD COLUMN "meetingLink" TEXT;

-- AlterTable
ALTER TABLE "booked_meetings"
ADD COLUMN "meetingLink" TEXT;
