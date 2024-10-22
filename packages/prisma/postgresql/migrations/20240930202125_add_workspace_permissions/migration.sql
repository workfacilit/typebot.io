/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId]` on the table `ProfilePermission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workspaceId` to the `ProfilePermission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProfilePermission" ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePermission_workspaceId_key" ON "ProfilePermission"("workspaceId");

-- AddForeignKey
ALTER TABLE "ProfilePermission" ADD CONSTRAINT "ProfilePermission_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
