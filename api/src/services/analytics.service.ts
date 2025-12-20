import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyticsService = {
    async trackView(qaId: string, metadata: any) {
        // Simple increment in DB as per instructions for no-Redis env
        try {
            const updatedPage = await prisma.qAPage.update({
                where: { id: qaId },
                data: {
                    viewCount: {
                        increment: 1
                    }
                },
                select: {
                    id: true,
                    viewCount: true
                }
            });
            return updatedPage;
        } catch (error) {
            console.error('Error tracking view:', error);
            // We might not want to throw here to avoid blocking the client if analytics fail?
            // But for API response it might be better to signal failure?
            // The requirement is "POST /api/analytics/view/:id (Public, no auth)". 
            // If the ID doesn't exist, update will fail.
            throw error;
        }
    },

    async getPopularPages(limit: number = 10) {
        return prisma.qAPage.findMany({
            where: {
                status: 'PUBLISHED', // Only show published pages in popular list
            },
            orderBy: {
                viewCount: 'desc',
            },
            take: limit,
            select: {
                id: true,
                title: true,
                slug: true,
                viewCount: true,
                type: true,
                category: {
                    select: {
                        name: true,
                        slug: true
                    }
                },
                author: {
                    select: {
                        email: true
                    }
                },
                updatedAt: true
            },
        });
    },

    async getViewStats(qaId: string) {
        const page = await prisma.qAPage.findUnique({
            where: { id: qaId },
            select: {
                viewCount: true
            }
        });

        if (!page) {
            throw new Error("Page not found"); // Or handle as null
        }

        // Since we only have total count, we return that.
        // If 'over time' was strictly required we'd need a separate table.
        return {
            totalViews: page.viewCount
        };
    },

    async getGlobalStats() {
        const [articleCount, userCount, totalViews] = await Promise.all([
            prisma.qAPage.count(),
            prisma.user.count(),
            prisma.qAPage.aggregate({
                _sum: {
                    viewCount: true
                }
            })
        ]);

        return {
            articles: articleCount,
            users: userCount,
            views: totalViews._sum.viewCount || 0
        };
    }
};
