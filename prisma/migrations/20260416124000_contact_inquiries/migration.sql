-- CreateEnum
CREATE TYPE "ContactInquiryStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED');

-- CreateTable
CREATE TABLE "contact_inquiries" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "ContactInquiryStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_inquiries_email_idx" ON "contact_inquiries"("email");

-- CreateIndex
CREATE INDEX "contact_inquiries_status_createdAt_idx" ON "contact_inquiries"("status", "createdAt");
