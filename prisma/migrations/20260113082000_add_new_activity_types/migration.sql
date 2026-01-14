-- AlterEnum: Add new activity types to ActivityName enum
-- Rename the old enum type
ALTER TYPE "ActivityName" RENAME TO "ActivityName_old";

-- Create the new enum type with all activity types
CREATE TYPE "ActivityName" AS ENUM (
  'PERIODIC_SERVICE',
  'SCHEDULED_MAINTENANCE',
  'UNSCHEDULED_MAINTENANCE',
  'TROUBLESHOOTING',
  'REPAIR_AND_ADJUSTMENT',
  'GENERAL_REPAIR',
  'PERIODIC_INSPECTION',
  'PERIODIC_INSPECTION_TYRE',
  'PERIODIC_SERVICE_TYRE',
  'RETORQUE_TYRE',
  'REPAIR_TYRE',
  'TROUBLESHOOTING_TYRE',
  'OTHER'
);

-- Update the MechanicActivity table to use the new enum type
ALTER TABLE "MechanicActivity" ALTER COLUMN "activityName" TYPE "ActivityName" USING "activityName"::text::"ActivityName";

-- Drop the old enum type
DROP TYPE "ActivityName_old";

