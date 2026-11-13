-- CreateTable
CREATE TABLE "ServiceVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bikeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "shop" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceVisit_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaintenanceEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bikeId" TEXT NOT NULL,
    "partId" TEXT,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "note" TEXT NOT NULL,
    "visitId" TEXT,
    "condition" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceEvent_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceEvent_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceEvent_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "ServiceVisit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MaintenanceEvent" ("bikeId", "createdAt", "date", "id", "note", "partId", "type") SELECT "bikeId", "createdAt", "date", "id", "note", "partId", "type" FROM "MaintenanceEvent";
DROP TABLE "MaintenanceEvent";
ALTER TABLE "new_MaintenanceEvent" RENAME TO "MaintenanceEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

