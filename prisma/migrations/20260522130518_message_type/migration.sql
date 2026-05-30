/*
  Warnings:

  - A unique constraint covering the columns `[externalMessageId]` on the table `Message` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "content" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Message_externalMessageId_key" ON "Message"("externalMessageId");
