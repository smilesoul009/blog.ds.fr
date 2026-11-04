-- CreateEnum
CREATE TYPE "WallpaperDevice" AS ENUM ('DESKTOP', 'MOBILE');

-- CreateEnum
CREATE TYPE "WallpaperSlot" AS ENUM ('LOGIN', 'APP', 'LOGOUT');

-- CreateTable
CREATE TABLE "Wallpaper" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT NOT NULL,
    "device" "WallpaperDevice" NOT NULL DEFAULT 'DESKTOP',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallpaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WallpaperAssignment" (
    "wallpaperId" TEXT NOT NULL,
    "slot" "WallpaperSlot" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WallpaperAssignment_pkey" PRIMARY KEY ("wallpaperId","slot")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Wallpaper_device_idx" ON "Wallpaper"("device");

-- CreateIndex
CREATE INDEX "WallpaperAssignment_slot_position_idx" ON "WallpaperAssignment"("slot", "position");

-- AddForeignKey
ALTER TABLE "Wallpaper" ADD CONSTRAINT "Wallpaper_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallpaperAssignment" ADD CONSTRAINT "WallpaperAssignment_wallpaperId_fkey" FOREIGN KEY ("wallpaperId") REFERENCES "Wallpaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
