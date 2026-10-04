-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "advisor_id" INTEGER;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
