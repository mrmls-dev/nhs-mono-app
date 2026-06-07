-- CreateEnum
CREATE TYPE "CommunityStatus" AS ENUM ('NOW_SELLING', 'COMING_SOON', 'SOLD_OUT');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Florida',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "County" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "boundsNorth" DOUBLE PRECISION NOT NULL,
    "boundsSouth" DOUBLE PRECISION NOT NULL,
    "boundsEast" DOUBLE PRECISION NOT NULL,
    "boundsWest" DOUBLE PRECISION NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "County_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "location" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "status" "CommunityStatus" NOT NULL,
    "homesForSale" INTEGER NOT NULL DEFAULT 0,
    "bedsMin" INTEGER NOT NULL,
    "bedsMax" INTEGER NOT NULL,
    "bathsMin" DECIMAL(4,1) NOT NULL,
    "bathsMax" DECIMAL(4,1) NOT NULL,
    "garageMin" INTEGER NOT NULL,
    "garageMax" INTEGER NOT NULL,
    "storiesMin" INTEGER NOT NULL,
    "storiesMax" INTEGER NOT NULL,
    "sqftFrom" INTEGER NOT NULL,
    "priceFrom" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "about" TEXT NOT NULL,
    "countyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMedia" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "communityId" TEXT NOT NULL,

    CONSTRAINT "CommunityMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityAmenity" (
    "communityId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "CommunityAmenity_pkey" PRIMARY KEY ("communityId","amenityId")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "grades" TEXT NOT NULL,
    "distance" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlanModel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "startingPrice" INTEGER NOT NULL,
    "beds" INTEGER NOT NULL,
    "baths" DECIMAL(4,1) NOT NULL,
    "garage" INTEGER NOT NULL,
    "stories" INTEGER NOT NULL,
    "sqft" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "modelVideo" TEXT,
    "description" TEXT,
    "diagramImage" TEXT,
    "communityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlanModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlanModelMedia" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "floorPlanId" TEXT NOT NULL,

    CONSTRAINT "FloorPlanModelMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "County_slug_key" ON "County"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- CreateIndex
CREATE INDEX "Community_countyId_idx" ON "Community"("countyId");

-- CreateIndex
CREATE INDEX "Community_status_idx" ON "Community"("status");

-- CreateIndex
CREATE INDEX "Community_priceFrom_idx" ON "Community"("priceFrom");

-- CreateIndex
CREATE INDEX "Community_lat_lng_idx" ON "Community"("lat", "lng");

-- CreateIndex
CREATE INDEX "CommunityMedia_communityId_idx" ON "CommunityMedia"("communityId");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_name_key" ON "Amenity"("name");

-- CreateIndex
CREATE INDEX "School_communityId_idx" ON "School"("communityId");

-- CreateIndex
CREATE INDEX "FloorPlanModel_communityId_idx" ON "FloorPlanModel"("communityId");

-- CreateIndex
CREATE INDEX "FloorPlanModel_startingPrice_idx" ON "FloorPlanModel"("startingPrice");

-- CreateIndex
CREATE UNIQUE INDEX "FloorPlanModel_communityId_slug_key" ON "FloorPlanModel"("communityId", "slug");

-- CreateIndex
CREATE INDEX "FloorPlanModelMedia_floorPlanId_idx" ON "FloorPlanModelMedia"("floorPlanId");

-- AddForeignKey
ALTER TABLE "County" ADD CONSTRAINT "County_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMedia" ADD CONSTRAINT "CommunityMedia_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAmenity" ADD CONSTRAINT "CommunityAmenity_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityAmenity" ADD CONSTRAINT "CommunityAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlanModel" ADD CONSTRAINT "FloorPlanModel_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlanModelMedia" ADD CONSTRAINT "FloorPlanModelMedia_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlanModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
