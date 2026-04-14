-- CreateTable
CREATE TABLE "availability_overrides" (
    "id" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "wid" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availability_overrides_hostId_wid_date_idx" ON "availability_overrides"("hostId", "wid", "date");

-- CreateIndex
CREATE INDEX "availability_overrides_wid_hostId_idx" ON "availability_overrides"("wid", "hostId");

-- AddForeignKey
ALTER TABLE "availability_overrides" ADD CONSTRAINT "availability_overrides_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
