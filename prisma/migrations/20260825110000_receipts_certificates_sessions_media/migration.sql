-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "Receipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiptNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT,
    "itemLabel" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "certificateNumber" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "formationTitle" TEXT NOT NULL,
    "completionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Formation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "sessionDate" DATETIME,
    "totalSeats" INTEGER,
    "seatsTaken" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Formation" ("createdAt", "description", "id", "imageUrl", "price", "program", "published", "slug", "title", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "price", "program", "published", "slug", "title", "updatedAt" FROM "Formation";
DROP TABLE "Formation";
ALTER TABLE "new_Formation" RENAME TO "Formation";
CREATE UNIQUE INDEX "Formation_slug_key" ON "Formation"("slug");
CREATE TABLE "new_Testimonial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT,
    "photoUrl" TEXT,
    "quote" TEXT NOT NULL,
    "rating" INTEGER,
    "mediaType" TEXT NOT NULL DEFAULT 'text',
    "mediaUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Testimonial" ("authorName", "authorRole", "createdAt", "id", "order", "photoUrl", "published", "quote", "rating", "updatedAt") SELECT "authorName", "authorRole", "createdAt", "id", "order", "photoUrl", "published", "quote", "rating", "updatedAt" FROM "Testimonial";
DROP TABLE "Testimonial";
ALTER TABLE "new_Testimonial" RENAME TO "Testimonial";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

