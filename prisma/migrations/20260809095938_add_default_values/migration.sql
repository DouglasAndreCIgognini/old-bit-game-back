/*
  Warnings:

  - The primary key for the `category_game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `category_game` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[link]` on the table `game` will be added. If there are existing duplicate values, this will fail.
  - Made the column `created_at` on table `category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `game` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `game` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "category_game_game_id_category_id_key";

-- AlterTable
ALTER TABLE "category" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "category_game" DROP CONSTRAINT "category_game_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "category_game_pkey" PRIMARY KEY ("game_id", "category_id");

-- AlterTable
ALTER TABLE "game" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE INDEX "category_game_category_id_idx" ON "category_game"("category_id");

-- CreateIndex
CREATE INDEX "category_game_game_id_idx" ON "category_game"("game_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_link_key" ON "game"("link");
