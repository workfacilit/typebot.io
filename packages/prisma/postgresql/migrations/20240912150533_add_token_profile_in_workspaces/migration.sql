/*
  Warnings:

  - Added the required column `token` to the `ProfileInWorkspace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProfileInWorkspace" ADD COLUMN     "token" TEXT NOT NULL;
