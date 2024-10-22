-- CreateTable
CREATE TABLE "ProfilePermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canCreateFlowOrFolder" BOOLEAN NOT NULL DEFAULT false,
    "canViewSettings" BOOLEAN NOT NULL DEFAULT false,
    "canCreateNewWorkspace" BOOLEAN NOT NULL DEFAULT false,
    "canConfigureTheme" BOOLEAN NOT NULL DEFAULT false,
    "canConfigureFlowSettings" BOOLEAN NOT NULL DEFAULT false,
    "canShareFlow" BOOLEAN NOT NULL DEFAULT false,
    "canPublish" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProfilePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePermission_userId_key" ON "ProfilePermission"("userId");

-- AddForeignKey
ALTER TABLE "ProfilePermission" ADD CONSTRAINT "ProfilePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
