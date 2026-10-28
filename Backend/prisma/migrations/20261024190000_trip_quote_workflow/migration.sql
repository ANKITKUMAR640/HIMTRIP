CREATE TYPE "QuoteStatus" AS ENUM ('NONE', 'SENT', 'ACCEPTED', 'REJECTED');

ALTER TABLE "inquiries"
  ADD COLUMN "duration" TEXT,
  ADD COLUMN "itinerary" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "destinationState" TEXT,
  ADD COLUMN "quotedPrice" INTEGER,
  ADD COLUMN "quoteMessage" TEXT,
  ADD COLUMN "quoteStatus" "QuoteStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "quoteSentAt" TIMESTAMP(3),
  ADD COLUMN "quoteRespondedAt" TIMESTAMP(3),
  ADD COLUMN "bookingConfirmedAt" TIMESTAMP(3);
