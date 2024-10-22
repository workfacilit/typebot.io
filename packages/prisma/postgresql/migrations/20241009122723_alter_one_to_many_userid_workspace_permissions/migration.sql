/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,userId]` on the table `ProfilePermission` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProfilePermission_userId_key";

-- DropIndex
DROP INDEX "ProfilePermission_workspaceId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePermission_workspaceId_userId_key" ON "ProfilePermission"("workspaceId", "userId");
