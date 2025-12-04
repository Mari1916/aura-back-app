/*
  Warnings:

  - Made the column `nome` on table `Usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `profissao` on table `Usuario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `empresa` on table `Usuario` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "nome" SET NOT NULL,
ALTER COLUMN "profissao" SET NOT NULL,
ALTER COLUMN "empresa" SET NOT NULL;
