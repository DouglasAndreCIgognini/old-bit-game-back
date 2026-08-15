/*
  Warnings:

  - Added the required column `core` to the `game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "game" ADD COLUMN     "core" TEXT NOT NULL;
