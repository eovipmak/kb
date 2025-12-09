import { prisma } from '../utils/db';
import { QAPage, Prisma } from '@prisma/client';
import { Status, PageType, Role } from '../types';
import removeMarkdown from 'remove-markdown';
import { MetadataService } from './metadata.service';

export class QAService {
    static async generateSlug(title: string): Promise<string> {
        let slug = title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
            .replace(/\s+/g, '-')     // Replace spaces with hyphens
            .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
            .trim();

        // Ensure uniqueness
        let uniqueSlug = slug;
        let counter = 1;
        while (await prisma.qAPage.findUnique({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }
        return uniqueSlug;
    }

    static async createQAPage(data: { title: string; contentMarkdown: string; type?: PageType; tags?: string[]; categoryId?: string }, authorId: string) {
        const slug = await this.generateSlug(data.title);
        const contentText = removeMarkdown(data.contentMarkdown);

        return prisma.qAPage.create({
            data: {
                title: data.title,
                contentMarkdown: data.contentMarkdown,
                contentText,
                slug,
                type: data.type || PageType.FAQ,
                authorId,
                categoryId: data.categoryId,
                tags: data.tags ? {
                    connectOrCreate: data.tags.map(tag => {
                        const normalized = MetadataService.normalizeTagName(tag);
                        return {
                            where: { name: normalized },
                            create: { name: normalized }
                        };
                    })
                } : undefined
            },
            include: {
                tags: true,
                category: true,
                author: {
                    select: { id: true, email: true, role: true }
                }
            }
        });
    }

    static async getQAPageById(id: string, userId?: string, userRole?: Role) {
        const page = await prisma.qAPage.findUnique({
            where: { id },
            include: {
                tags: true,
                category: true,
                author: {
                    select: { id: true, email: true, role: true }
                }
            }
        });

        if (!page) return null;

        // If published, anyone can view
        if (page.status === Status.PUBLISHED) return page;

        // If not published, check permissions
        if (!userId) throw new Error('Unauthorized'); // Public tries to access draft

        if (userRole === Role.ADMIN || page.authorId === userId) {
            return page;
        }

        throw new Error('Forbidden');
    }

    static async updateQAPage(id: string, data: { title?: string; contentMarkdown?: string; status?: Status; type?: PageType; tags?: string[]; categoryId?: string }, userId: string, userRole: Role) {
        const page = await prisma.qAPage.findUnique({ where: { id } });
        if (!page) throw new Error('Not found');

        // Check permissions
        if (userRole !== Role.ADMIN && page.authorId !== userId) {
            throw new Error('Forbidden');
        }

        // Prepare update data
        const updateData: any = { ...data };

        if (data.title && data.title !== page.title) {
            updateData.slug = await this.generateSlug(data.title);
        }

        if (data.contentMarkdown) {
            updateData.contentText = removeMarkdown(data.contentMarkdown);
        }

        if (data.tags) {
            updateData.tags = {
                set: [], // Clear existing relations
                connectOrCreate: data.tags.map(tag => {
                    const normalized = MetadataService.normalizeTagName(tag);
                    return {
                        where: { name: normalized },
                        create: { name: normalized }
                    };
                })
            };
        }

        return prisma.qAPage.update({
            where: { id },
            data: updateData,
            include: {
                tags: true,
                category: true
            }
        });
    }

    static async deleteQAPage(id: string, userId: string, userRole: Role) {
        const page = await prisma.qAPage.findUnique({ where: { id } });
        if (!page) throw new Error('Not found');

        if (userRole !== Role.ADMIN && page.authorId !== userId) {
            throw new Error('Forbidden');
        }

        return prisma.qAPage.delete({ where: { id } });
    }

    static async listQAPages(filters: { status?: Status; type?: PageType; authorId?: string }) {
        const where: Prisma.QAPageWhereInput = {};

        if (filters.status) where.status = filters.status;
        if (filters.type) where.type = filters.type;
        if (filters.authorId) where.authorId = filters.authorId;

        return prisma.qAPage.findMany({
            where,
            include: {
                tags: true,
                category: true,
                author: {
                    select: { id: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
