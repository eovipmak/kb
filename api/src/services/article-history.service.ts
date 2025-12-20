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
            oldContent: JSON.parse(record.oldContent),
            createdAt: record.createdAt
        }));
    }
}
