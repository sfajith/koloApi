/*
  Warnings:

  - You are about to drop the column `whatsappAccessToken` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappBusinessId` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappPhoneNumberId` on the `Business` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Business_whatsappPhoneNumberId_key";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "whatsappAccessToken",
DROP COLUMN "whatsappBusinessId",
DROP COLUMN "whatsappPhoneNumberId";

-- CreateTable
CREATE TABLE "ChannelConnection" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "provider" "Channel" NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConnection_provider_externalAccountId_key" ON "ChannelConnection"("provider", "externalAccountId");

-- AddForeignKey
ALTER TABLE "ChannelConnection" ADD CONSTRAINT "ChannelConnection_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
