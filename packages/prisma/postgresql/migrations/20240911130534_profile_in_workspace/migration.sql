-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profile" TEXT,
ADD COLUMN     "token" TEXT;

-- CreateTable
CREATE TABLE "ProfileInWorkspace" (
    "profileId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileInWorkspace_profileId_workspaceId_key" ON "ProfileInWorkspace"("profileId", "workspaceId");

-- AddForeignKey
ALTER TABLE "ProfileInWorkspace" ADD CONSTRAINT "ProfileInWorkspace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
