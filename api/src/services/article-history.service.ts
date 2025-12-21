import { prisma } from '../utils/db';
import { Role } from '../types';

export class ArticleHistoryService {
    /**
     * Create a history record before updating an article
     */
    static async createHistoryRecord(
        articleId: string,
        changedByUserId: string,
        oldContent: {
            title: string;
            contentHtml: string;
            contentText: string;
            status: string;
            type: string;
            categoryId: string | null;
            tags: Array<{ id: string; name: string }>;
        }
    ) {
        return prisma.articleHistory.create({
            data: {
                articleId,
                changedByUserId,
                oldContent: JSON.stringify(oldContent)
            }
        });
    }

    /**
     * Get article history for a specific article
     * Only accessible by Admin or the article author
     */
    static async getArticleHistory(articleId: string, userId: string, userRole: Role) {
        // First verify the article exists and check permissions
        const article = await prisma.qAPage.findUnique({
            where: { id: articleId }
        });

        if (!article) {
            throw new Error('Article not found');
        }

        // Check permissions: Admin or Author only
        if (userRole !== Role.ADMIN && article.authorId !== userId) {
            throw new Error('Forbidden');
        }

        // Fetch history with user information
        const history = await prisma.articleHistory.findMany({
            where: { articleId },
            include: {
                changedBy: {
                    select: {
                        id: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Parse oldContent JSON for each record
        return history.map(record => ({
            id: record.id,
            articleId: record.articleId,
            changedBy: record.changedBy,
            oldContent: (() => {
                try {
                    return JSON.parse(record.oldContent);
                } catch (error) {
                    // Return a safe fallback if parsing fails
                    return {
                        title: 'Unknown',
                        contentHtml: '',
                        contentText: '',
                        status: 'DRAFT',
                        type: 'FAQ',
                        categoryId: null,
                        tags: []
                    };
                }
            })(),
            createdAt: record.createdAt
        }));
    }

    /**
     * Restore article from a history record
     * Only accessible by Admin or the article author
     */
    static async restoreFromHistory(historyId: string, userId: string, userRole: Role) {
        // Get the history record
        const historyRecord = await prisma.articleHistory.findUnique({
            where: { id: historyId },
            include: {
                article: {
                    include: { tags: true }
                }
            }
        });

        if (!historyRecord) {
            throw new Error('History record not found');
        }

        const article = historyRecord.article;

        // Check permissions: Admin or Author only
        if (userRole !== Role.ADMIN && article.authorId !== userId) {
            throw new Error('Forbidden');
        }

        // Parse the old content with error handling
        let oldContent;
        try {
            oldContent = JSON.parse(historyRecord.oldContent);
        } catch (error) {
            throw new Error('Invalid history record data');
        }

        // Create a history record for the current state before restoring
        await this.createHistoryRecord(article.id, userId, {
            title: article.title,
            contentHtml: article.contentHtml,
            contentText: article.contentText,
            status: article.status,
            type: article.type,
            categoryId: article.categoryId,
            tags: article.tags
        });

        // Return the old content to be restored
        return {
            historyRecord,
            oldContent
        };
    }
}
