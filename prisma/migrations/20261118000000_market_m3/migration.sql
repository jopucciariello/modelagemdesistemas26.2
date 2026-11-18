-- CreateTable
CREATE TABLE "MerchantFamily" (
    "merchantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    PRIMARY KEY ("merchantId", "categoryId"),
    CONSTRAINT "MerchantFamily_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MerchantFamily_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerchantRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "shopUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListingReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "keywords" TEXT,
    "componentId" TEXT,
    "maxPriceCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dream_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dream_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Dream" ("categoryId", "createdAt", "id", "keywords", "maxPriceCents", "userId") SELECT "categoryId", "createdAt", "id", "keywords", "maxPriceCents", "userId" FROM "Dream";
DROP TABLE "Dream";
ALTER TABLE "new_Dream" RENAME TO "Dream";
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "condition" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "usedKm" REAL,
    "photoUrls" TEXT NOT NULL DEFAULT '',
    "componentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "removedReason" TEXT,
    "removedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Listing_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("categoryId", "condition", "createdAt", "description", "id", "photoUrls", "priceCents", "removedAt", "removedReason", "sellerId", "status", "title", "updatedAt", "usedKm") SELECT "categoryId", "condition", "createdAt", "description", "id", "photoUrls", "priceCents", "removedAt", "removedReason", "sellerId", "status", "title", "updatedAt", "usedKm" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE INDEX "Listing_status_categoryId_idx" ON "Listing"("status", "categoryId");
CREATE TABLE "new_Merchant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "shopUrl" TEXT,
    "dreamAlerts" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Merchant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Merchant" ("createdAt", "description", "id", "name", "userId", "verified", "verifiedAt") SELECT "createdAt", "description", "id", "name", "userId", "verified", "verifiedAt" FROM "Merchant";
DROP TABLE "Merchant";
ALTER TABLE "new_Merchant" RENAME TO "Merchant";
CREATE UNIQUE INDEX "Merchant_userId_key" ON "Merchant"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ATHLETE',
    "activitySource" TEXT NOT NULL DEFAULT 'MANUAL',
    "lastSyncAt" DATETIME,
    "lastSyncError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "whatsapp" TEXT,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("activitySource", "createdAt", "email", "id", "lastSyncAt", "lastSyncError", "name", "role", "updatedAt") SELECT "activitySource", "createdAt", "email", "id", "lastSyncAt", "lastSyncError", "name", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MerchantRequest_status_idx" ON "MerchantRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ListingReport_listingId_reporterId_key" ON "ListingReport"("listingId", "reporterId");

