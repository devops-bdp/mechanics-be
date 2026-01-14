-- CreateEnum
CREATE TYPE "ActivityName" AS ENUM ('PERIODIC_SERVICE', 'SCHEDULED_MAINTENANCE', 'UNSCHEDULED_MAINTENANCE', 'TROUBLESHOOTING', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDING', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED');

-- CreateEnum
CREATE TYPE "PauseReason" AS ENUM ('WAITING_PARTS', 'REST_AND_PRAY', 'OTHER');

-- CreateTable
CREATE TABLE "MechanicActivity" (
    "id" TEXT NOT NULL,
    "activityName" "ActivityName" NOT NULL,
    "unitId" TEXT NOT NULL,
    "description" TEXT,
    "remarks" TEXT,
    "activityStatus" "ActivityStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "MechanicActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityMechanic" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "mechanicId" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "pauseReason" "PauseReason",
    "totalWorkTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityMechanic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MechanicWorkTime" (
    "id" TEXT NOT NULL,
    "mechanicId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "workTime" INTEGER NOT NULL,
    "pauseTime" INTEGER NOT NULL,
    "totalWorkTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "MechanicWorkTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityMechanic_activityId_mechanicId_key" ON "ActivityMechanic"("activityId", "mechanicId");

-- AddForeignKey
ALTER TABLE "MechanicActivity" ADD CONSTRAINT "MechanicActivity_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityMechanic" ADD CONSTRAINT "ActivityMechanic_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "MechanicActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityMechanic" ADD CONSTRAINT "ActivityMechanic_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MechanicWorkTime" ADD CONSTRAINT "MechanicWorkTime_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
