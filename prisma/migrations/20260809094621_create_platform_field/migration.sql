/*
  Warnings:

  - Added the required column `platform` to the `game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "game" ADD COLUMN     "platform" TEXT NOT NULL;
