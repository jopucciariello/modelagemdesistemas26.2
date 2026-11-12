-- AlterTable
ALTER TABLE "Component" ADD COLUMN "code" TEXT;
ALTER TABLE "Component" ADD COLUMN "details" TEXT;
ALTER TABLE "Component" ADD COLUMN "modality" TEXT;
ALTER TABLE "Component" ADD COLUMN "priceMax" REAL;
ALTER TABLE "Component" ADD COLUMN "priceMin" REAL;
ALTER TABLE "Component" ADD COLUMN "subcategory" TEXT;

-- AlterTable
ALTER TABLE "Part" ADD COLUMN "position" TEXT;

-- CreateTable
CREATE TABLE "ComponentPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "componentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intervalKm" REAL,
    "intervalHours" REAL,
    "action" TEXT NOT NULL,
    CONSTRAINT "ComponentPlan_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BikeModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT,
    "category" TEXT,
    "frame" TEXT,
    "listPrice" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "BikeModelPart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bikeModelId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    CONSTRAINT "BikeModelPart_bikeModelId_fkey" FOREIGN KEY ("bikeModelId") REFERENCES "BikeModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BikeModelPart_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "bikeModelId" TEXT,
    "stravaGearId" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bike_bikeModelId_fkey" FOREIGN KEY ("bikeModelId") REFERENCES "BikeModel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bike" ("archivedAt", "brand", "createdAt", "id", "model", "name", "stravaGearId", "type", "updatedAt", "userId", "year") SELECT "archivedAt", "brand", "createdAt", "id", "model", "name", "stravaGearId", "type", "updatedAt", "userId", "year" FROM "Bike";
DROP TABLE "Bike";
ALTER TABLE "new_Bike" RENAME TO "Bike";
CREATE UNIQUE INDEX "Bike_userId_stravaGearId_key" ON "Bike"("userId", "stravaGearId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "BikeModel_code_key" ON "BikeModel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Component_code_key" ON "Component"("code");

