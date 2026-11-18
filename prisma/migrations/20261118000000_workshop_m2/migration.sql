
-- CreateTable
CREATE TABLE "WorkshopHour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workshopId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    CONSTRAINT "WorkshopHour_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkshopMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workshopId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkshopMember_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaintenancePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intervalKm" REAL,
    "intervalHours" REAL,
    "warnKm" REAL,
    "warnHours" REAL,
    "action" TEXT NOT NULL,
    "lastServiceAt" DATETIME,
    "stageHours" TEXT,
    "stageIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MaintenancePlan_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MaintenancePlan" ("action", "id", "intervalHours", "intervalKm", "lastServiceAt", "name", "partId", "warnHours", "warnKm") SELECT "action", "id", "intervalHours", "intervalKm", "lastServiceAt", "name", "partId", "warnHours", "warnKm" FROM "MaintenancePlan";
DROP TABLE "MaintenancePlan";
ALTER TABLE "new_MaintenancePlan" RENAME TO "MaintenancePlan";
CREATE TABLE "new_Workshop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "requestText" TEXT,
    "contact" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Workshop" ("active", "address", "createdAt", "description", "id", "name", "ownerEmail", "phone", "updatedAt") SELECT "active", "address", "createdAt", "description", "id", "name", "ownerEmail", "phone", "updatedAt" FROM "Workshop";
DROP TABLE "Workshop";
ALTER TABLE "new_Workshop" RENAME TO "Workshop";
CREATE UNIQUE INDEX "Workshop_ownerEmail_key" ON "Workshop"("ownerEmail");
CREATE TABLE "new_WorkshopService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workshopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "includes" TEXT NOT NULL DEFAULT '',
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "priceCents" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "WorkshopService_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkshopService" ("active", "description", "id", "includes", "name", "workshopId") SELECT "active", "description", "id", "includes", "name", "workshopId" FROM "WorkshopService";
DROP TABLE "WorkshopService";
ALTER TABLE "new_WorkshopService" RENAME TO "WorkshopService";
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workshopId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bikeId" TEXT NOT NULL,
    "serviceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "endsAt" DATETIME,
    "shareHistory" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "completedAt" DATETIME,
    "visitId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "WorkshopSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "WorkshopService" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "ServiceVisit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("bikeId", "cancelledAt", "completedAt", "createdAt", "id", "serviceId", "slotId", "status", "userId", "visitId", "workshopId") SELECT "bikeId", "cancelledAt", "completedAt", "createdAt", "id", "serviceId", "slotId", "status", "userId", "visitId", "workshopId" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE UNIQUE INDEX "Appointment_visitId_key" ON "Appointment"("visitId");
CREATE INDEX "Appointment_workshopId_status_idx" ON "Appointment"("workshopId", "status");
CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WorkshopHour_workshopId_idx" ON "WorkshopHour"("workshopId");

-- CreateIndex
CREATE INDEX "WorkshopMember_email_idx" ON "WorkshopMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopMember_workshopId_email_key" ON "WorkshopMember"("workshopId", "email");


-- Backfill: bookings made before this migration required consent (RF27 old rule) and lasted one hour.
UPDATE "Appointment" SET "shareHistory" = true, "endsAt" = (SELECT strftime('%Y-%m-%dT%H:%M:%f+00:00', "startsAt", '+1 hour') FROM "WorkshopSlot" WHERE "WorkshopSlot"."id" = "Appointment"."slotId");
