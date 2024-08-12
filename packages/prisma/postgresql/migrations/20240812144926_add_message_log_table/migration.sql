-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('inbound', 'outbound');

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "messageId" TEXT,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);
