-- CreateTable
CREATE TABLE "ArticleHistory" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "oldContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArticleHistory" ADD CONSTRAINT "ArticleHistory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "QAPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleHistory" ADD CONSTRAINT "ArticleHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
