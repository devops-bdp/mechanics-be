-- CreateEnum
CREATE TYPE "UnitBrand" AS ENUM ('VOLVO', 'NISSAN', 'TOYOTA', 'MITSUBISHI', 'KOMATSU', 'LIEBHERR', 'ISUZU', 'DAIHATSU', 'KENT_POWER', 'SANY', 'JIEFANG', 'HYUNDAI', 'FUJI', 'YUCHAI', 'YANMAR', 'DONGFENG', 'OTHER');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('PMVV', 'DT', 'LV', 'CT', 'WT', 'GENSET', 'OTHER');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('ACTIVE', 'BREAKDOWN');

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "unitType" "UnitType" NOT NULL,
    "unitBrand" "UnitBrand" NOT NULL,
    "unitCode" TEXT NOT NULL,
    "unitDescription" TEXT,
    "unitImage" TEXT,
    "unitStatus" "UnitStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_unitCode_key" ON "Unit"("unitCode");
