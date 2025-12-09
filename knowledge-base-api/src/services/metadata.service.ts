import { prisma } from '../utils/db';
import { Tag, Category, Prisma } from '@prisma/client';

export class MetadataService {
    static normalizeTagName(name: string): string {
        return name.toLowerCase().replace(/\s+/g, '');
    }

    static async createTag(name: string): Promise<Tag> {
        const normalizedName = this.normalizeTagName(name);
        return prisma.tag.upsert({
            where: { name: normalizedName },
            update: {},
            create: { name: normalizedName }
        });
    }

    static async createCategory(name: string, slug: string): Promise<Category> {
        // Validation: Category slug: kebab-case
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
            throw new Error('Invalid slug format: must be kebab-case');
        }

        return prisma.category.create({
            data: {
                name,
                slug
            }
        });
    }

    static async attachTagsToQA(qaId: string, tagNames: string[]): Promise<any> {
        return prisma.qAPage.update({
            where: { id: qaId },
            data: {
                tags: {
                    connectOrCreate: tagNames.map(tag => {
                        const normalized = this.normalizeTagName(tag);
                        return {
                            where: { name: normalized },
                            create: { name: normalized }
                        };
                    })
                }
            },
            include: {
                tags: true
            }
        });
    }

    static async listAllTags(): Promise<any[]> {
        return prisma.tag.findMany({
            include: {
                _count: {
                    select: { qaPages: true }
                }
            }
        });
    }

    static async listAllCategories(): Promise<Category[]> {
        return prisma.category.findMany();
    }
}
