/*
  Warnings:

  - You are about to drop the column `remindDate` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `sent` on the `Reminder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "remindDate",
DROP COLUMN "sent";
