-- AlterTable
ALTER TABLE "ProfilePermission" ADD COLUMN     "canDeleteFlow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canDuplicateAndExport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewResults" BOOLEAN NOT NULL DEFAULT false;
