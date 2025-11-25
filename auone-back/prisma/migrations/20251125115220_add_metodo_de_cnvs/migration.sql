/*
  Warnings:

  - You are about to drop the column `role` on the `ChatMessage` table. All the data in the column will be lost.
  - Added the required column `usuarioId` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "role",
ADD COLUMN     "usuarioId" TEXT NOT NULL;
