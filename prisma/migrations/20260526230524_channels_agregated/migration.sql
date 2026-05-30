/*
  Warnings:

  - Added the required column `channel` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'MESSENGER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageType" ADD VALUE 'LOCATION';
ALTER TYPE "MessageType" ADD VALUE 'STICKER';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "channel" "Channel" NOT NULL;
