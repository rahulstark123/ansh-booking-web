-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('GOOGLE');

-- CreateTable
CREATE TABLE "integration_connections" (
    "id" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "wid" INTEGER NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_connections_hostId_provider_key" ON "integration_connections"("hostId", "provider");

-- CreateIndex
CREATE INDEX "integration_connections_wid_hostId_idx" ON "integration_connections"("wid", "hostId");

-- AddForeignKey
ALTER TABLE "integration_connections"
ADD CONSTRAINT "integration_connections_hostId_fkey"
FOREIGN KEY ("hostId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
