-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UnitBrand" ADD VALUE 'MONTOYA';
ALTER TYPE "UnitBrand" ADD VALUE 'SHARK';
ALTER TYPE "UnitBrand" ADD VALUE 'KAESER';
ALTER TYPE "UnitBrand" ADD VALUE 'KORINDO';
ALTER TYPE "UnitBrand" ADD VALUE 'TRUPOWER';
ALTER TYPE "UnitBrand" ADD VALUE 'PRO_QUIP';
ALTER TYPE "UnitBrand" ADD VALUE 'AMIX';
ALTER TYPE "UnitBrand" ADD VALUE 'MANITOU';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UnitType" ADD VALUE 'DOLLY';
ALTER TYPE "UnitType" ADD VALUE 'VESSEL';
ALTER TYPE "UnitType" ADD VALUE 'SELF_LOADER';
ALTER TYPE "UnitType" ADD VALUE 'TELEHANDLER';
ALTER TYPE "UnitType" ADD VALUE 'GENERATOR_SET';
ALTER TYPE "UnitType" ADD VALUE 'EXCAVATOR';
ALTER TYPE "UnitType" ADD VALUE 'BUS_MANHAUL';
ALTER TYPE "UnitType" ADD VALUE 'AIR_COMPRESSSOR';
