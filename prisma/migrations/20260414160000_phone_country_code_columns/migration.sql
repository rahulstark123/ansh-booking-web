-- AlterTable
ALTER TABLE "booked_meetings"
ADD COLUMN "guestCountryCode" TEXT;

-- AlterTable
ALTER TABLE "contacts"
ADD COLUMN "countryCode" TEXT;
