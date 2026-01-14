/*
  Warnings:

  - You are about to drop the column `endDate` on the `MechanicActivity` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `MechanicActivity` table. All the data in the column will be lost.
  - Added the required column `estimatedStart` to the `MechanicActivity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MechanicActivity" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "estimatedStart" TIMESTAMP(3) NOT NULL;
