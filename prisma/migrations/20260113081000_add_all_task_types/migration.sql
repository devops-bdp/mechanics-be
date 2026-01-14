-- AlterEnum: Add all new task types for different activity types
-- Rename the old enum type
ALTER TYPE "TaskName" RENAME TO "TaskName_old";

-- Create the new enum type with all task types
CREATE TYPE "TaskName" AS ENUM (
  'PREPARING_PART',
  'PREPARING_PARTS',
  'PREPARING_TOOLS',
  'PREPARING_TYRE_AND_MATERIAL',
  'TRAVELING',
  'WASHING_UNIT',
  'WASHING_UNITS',
  'PRE_INSPECTION',
  'ON_PROCESS',
  'PELAKSANAAN_PS',
  'PELAKSANAAN_BACKLOG',
  'PAP',
  'PPM',
  'REMOVE_INSTALL_TYRE',
  'RETORQUE',
  'FINAL_CHECK',
  'FINAL_CHECK_AND_GROUND_TEST',
  'REPORTING',
  'HOUSEKEEPING'
);

-- Update the Task table to use the new enum type
-- Map existing values to new enum
ALTER TABLE "Task" ALTER COLUMN "taskName" TYPE "TaskName" USING 
  CASE 
    WHEN "taskName"::text = 'PREPARING_TOOLS' THEN 'PREPARING_TOOLS'::"TaskName"
    WHEN "taskName"::text = 'REPORTING' THEN 'REPORTING'::"TaskName"
    WHEN "taskName"::text = 'ON_PROCESS' THEN 'ON_PROCESS'::"TaskName"
    WHEN "taskName"::text = 'HOUSE_KEEPING' THEN 'HOUSEKEEPING'::"TaskName"
    WHEN "taskName"::text = 'PREPARING_PART' THEN 'PREPARING_PART'::"TaskName"
    WHEN "taskName"::text = 'WASHING_UNIT' THEN 'WASHING_UNIT'::"TaskName"
    WHEN "taskName"::text = 'PRE_INSPECTION' THEN 'PRE_INSPECTION'::"TaskName"
    WHEN "taskName"::text = 'PELAKSANAAN_PS' THEN 'PELAKSANAAN_PS'::"TaskName"
    WHEN "taskName"::text = 'PELAKSANAAN_BACKLOG' THEN 'PELAKSANAAN_BACKLOG'::"TaskName"
    WHEN "taskName"::text = 'PAP' THEN 'PAP'::"TaskName"
    WHEN "taskName"::text = 'PPM' THEN 'PPM'::"TaskName"
    ELSE 'PREPARING_PART'::"TaskName"  -- Default fallback
  END;

-- Drop the old enum type
DROP TYPE "TaskName_old";

