-- AlterTable
ALTER TABLE "MechanicActivity" ADD COLUMN     "assignedGroupLeaderId" TEXT;

-- AddForeignKey
ALTER TABLE "MechanicActivity" ADD CONSTRAINT "MechanicActivity_assignedGroupLeaderId_fkey" FOREIGN KEY ("assignedGroupLeaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
