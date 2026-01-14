-- AlterEnum: Update TaskName enum to include all 10 tasks for PERIODIC_SERVICE
-- Drop old enum values and recreate with new values
-- Note: This will fail if there are existing tasks using ON_PROCESS or HOUSE_KEEPING
-- If that's the case, you'll need to migrate the data first

-- Rename the old enum type
ALTER TYPE "TaskName" RENAME TO "TaskName_old";

-- Create the new enum type with all 10 tasks
CREATE TYPE "TaskName" AS ENUM (
  'PREPARING_PART',
  'PREPARING_TOOLS',
  'WASHING_UNIT',
  'PRE_INSPECTION',
  'PELAKSANAAN_PS',
  'PELAKSANAAN_BACKLOG',
  'PAP',
  'PPM',
  'REPORTING',
  'HOUSEKEEPING'
);

-- Update the Task table to use the new enum type
-- Convert existing values: PREPARING_TOOLS stays, REPORTING stays
-- ON_PROCESS and HOUSE_KEEPING will need to be handled if they exist
ALTER TABLE "Task" ALTER COLUMN "taskName" TYPE "TaskName" USING 
  CASE 
    WHEN "taskName"::text = 'PREPARING_TOOLS' THEN 'PREPARING_TOOLS'::"TaskName"
    WHEN "taskName"::text = 'REPORTING' THEN 'REPORTING'::"TaskName"
    WHEN "taskName"::text = 'ON_PROCESS' THEN 'PREPARING_PART'::"TaskName"  -- Map old to new
    WHEN "taskName"::text = 'HOUSE_KEEPING' THEN 'HOUSEKEEPING'::"TaskName"  -- Map old to new
    ELSE 'PREPARING_PART'::"TaskName"  -- Default fallback
  END;

-- Drop the old enum type
DROP TYPE "TaskName_old";

