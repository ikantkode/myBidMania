-- AlterTable
-- First, combine schoolName and schoolCode for existing records
UPDATE "Project" SET "schoolName" = "schoolName" || ' - ' || "schoolCode" WHERE "schoolCode" != '';
UPDATE "Project" SET "schoolName" = "schoolName" WHERE "schoolCode" = '';

-- Then drop the schoolCode column
ALTER TABLE "Project" DROP COLUMN "schoolCode";
