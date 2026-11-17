-- CreateTable
CREATE TABLE "ModelRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "family" TEXT,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reply" TEXT,
    "answeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModelRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ModelRequest_userId_idx" ON "ModelRequest"("userId");

-- CreateIndex
CREATE INDEX "ModelRequest_status_idx" ON "ModelRequest"("status");
