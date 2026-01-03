-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('ON_TIME', 'DELAYED', 'EXTREMELY_DELAYED');

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "creditPeriod" INTEGER,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'ON_TIME';
