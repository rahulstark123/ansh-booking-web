-- AlterTable
ALTER TABLE "booked_meetings"
ADD COLUMN "guestPhone" TEXT;

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "wid" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "lastBookedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_hostId_email_key" ON "contacts"("hostId", "email");

-- CreateIndex
CREATE INDEX "contacts_wid_hostId_idx" ON "contacts"("wid", "hostId");

-- AddForeignKey
ALTER TABLE "contacts"
ADD CONSTRAINT "contacts_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
