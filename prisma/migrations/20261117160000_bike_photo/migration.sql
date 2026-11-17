-- CreateTable
CREATE TABLE "BikePhoto" (
    "bikeId" TEXT NOT NULL PRIMARY KEY,
    "contentType" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BikePhoto_bikeId_fkey" FOREIGN KEY ("bikeId") REFERENCES "Bike" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

