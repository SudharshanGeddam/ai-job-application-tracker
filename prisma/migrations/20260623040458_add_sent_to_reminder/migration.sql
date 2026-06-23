/*
  Warnings:

  - Added the required column `remindDate` to the `Reminder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "remindDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sent" BOOLEAN NOT NULL DEFAULT false;
