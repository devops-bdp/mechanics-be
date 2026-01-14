-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USERS');

-- CreateEnum
CREATE TYPE "Posision" AS ENUM ('MEKANIK', 'ELECTRICIAN', 'WELDER', 'TYREMAN', 'GROUP_LEADER_MEKANIK', 'GROUP_LEADER_TYRE', 'SUPERVISOR', 'DEPT_HEAD', 'MANAGEMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nrp" INTEGER NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USERS',
    "posisi" "Posision" NOT NULL DEFAULT 'MEKANIK',
    "avatar" TEXT,
    "phoneNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
