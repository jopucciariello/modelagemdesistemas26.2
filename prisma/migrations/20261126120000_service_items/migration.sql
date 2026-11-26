-- CreateTable
CREATE TABLE "WorkshopServiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "resetsWear" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "WorkshopServiceItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "WorkshopService" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkshopServiceItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopServiceItem_serviceId_categoryId_key" ON "WorkshopServiceItem"("serviceId", "categoryId");
