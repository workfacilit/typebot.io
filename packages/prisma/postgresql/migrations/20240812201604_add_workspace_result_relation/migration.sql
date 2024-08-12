/*
  Warnings:

  - You are about to drop the column `messageId` on the `MessageLog` table. All the data in the column will be lost.
  - Added the required column `resultId` to the `MessageLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MessageLog" DROP COLUMN "messageId",
ADD COLUMN     "identifier" TEXT,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "resultId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
