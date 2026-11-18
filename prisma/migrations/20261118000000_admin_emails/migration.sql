-- CreateTable
CREATE TABLE "AdminEmail" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "addedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
