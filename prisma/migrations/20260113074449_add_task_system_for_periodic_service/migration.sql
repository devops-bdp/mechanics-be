-- CreateEnum
CREATE TYPE "TaskName" AS ENUM ('PREPARING_TOOLS', 'ON_PROCESS', 'REPORTING', 'HOUSE_KEEPING');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "activityMechanicId" TEXT NOT NULL,
    "taskName" "TaskName" NOT NULL,
    "order" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_activityMechanicId_taskName_key" ON "Task"("activityMechanicId", "taskName");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_activityMechanicId_fkey" FOREIGN KEY ("activityMechanicId") REFERENCES "ActivityMechanic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
