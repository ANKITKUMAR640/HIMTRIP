-- Initial Himtrip schema. For an already-created database, mark this migration as applied
-- instead of running it against existing tables. See README.md for the safe baseline steps.
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'IN_DISCUSSION', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "phone" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inquiries" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "message" TEXT NOT NULL,
  "tripName" TEXT,
  "travelDate" TIMESTAMP(3),
  "travelers" INTEGER,
  "budget" TEXT,
  "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
  "adminNotes" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE UNIQUE INDEX "inquiries_reference_key" ON "inquiries"("reference");
CREATE INDEX "inquiries_status_createdAt_idx" ON "inquiries"("status", "createdAt");
CREATE INDEX "inquiries_email_createdAt_idx" ON "inquiries"("email", "createdAt");
CREATE INDEX "inquiries_userId_createdAt_idx" ON "inquiries"("userId", "createdAt");
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
