-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CLIENT';

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "isStarter" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ClientArticle" (
    "clientId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "assignedById" TEXT,
    "comment" TEXT,
    "assignedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "favoritedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientArticle_pkey" PRIMARY KEY ("clientId","articleId")
);

-- CreateTable
CREATE TABLE "ClientAuthor" (
    "clientId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientAuthor_pkey" PRIMARY KEY ("clientId","authorId")
);

-- CreateIndex
CREATE INDEX "ClientArticle_clientId_assignedAt_idx" ON "ClientArticle"("clientId", "assignedAt");

-- CreateIndex
CREATE INDEX "ClientArticle_clientId_favoritedAt_idx" ON "ClientArticle"("clientId", "favoritedAt");

-- CreateIndex
CREATE INDEX "ClientAuthor_authorId_idx" ON "ClientAuthor"("authorId");

-- CreateIndex
CREATE INDEX "Article_isStarter_idx" ON "Article"("isStarter");

-- AddForeignKey
ALTER TABLE "ClientArticle" ADD CONSTRAINT "ClientArticle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientArticle" ADD CONSTRAINT "ClientArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientArticle" ADD CONSTRAINT "ClientArticle_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAuthor" ADD CONSTRAINT "ClientAuthor_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAuthor" ADD CONSTRAINT "ClientAuthor_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
