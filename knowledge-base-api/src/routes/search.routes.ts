import { FastifyInstance } from 'fastify';
import { SearchService } from '../services/search.service';
import { Status } from '../types';

interface SearchQuery {
    q: string;
    type?: string;
    categoryId?: string;
    tags?: string;
    page?: number;
    limit?: number;
}

export async function searchRoutes(fastify: FastifyInstance) {
    fastify.get<{ Querystring: SearchQuery }>('/search', {
        schema: {
            querystring: {
                type: 'object',
                required: ['q'],
                properties: {
                    q: { type: 'string' },
                    type: { type: 'string', enum: ['FAQ', 'TROUBLESHOOTING'] },
                    categoryId: { type: 'string' },
                    tags: { type: 'string' },
                    page: { type: 'integer', default: 1, minimum: 1 },
                    limit: { type: 'integer', default: 20, maximum: 100, minimum: 5 }
                }
            }
        },
        config: {
            rateLimit: {
                max: 100,
                timeWindow: '1 minute'
            }
        }
    }, async (request, reply) => {
        const { q, type, categoryId, tags, page = 1, limit = 20 } = request.query;

        const filters: any = {
            status: [Status.PUBLISHED]
        };

        if (type) {
            filters.type = [type];
        }

        if (categoryId) {
            filters.categoryId = categoryId;
        }

        if (tags) {
            filters.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }

        try {
            const result = await SearchService.searchDocuments(q, filters, page, limit);

            const hits = result.hits.map((hit: any) => ({
                id: hit.id,
                slug: hit.slug,
                title: hit.title,
                snippet: hit.contentText ? hit.contentText.substring(0, 200) : '',
                type: hit.type,
                tags: hit.tags,
                category: hit.category || { name: 'Unknown', slug: 'unknown' },
                createdAt: new Date(hit.createdAt).toISOString(),
                _formatted: hit._formatted
            }));

            return {
                hits,
                query: q,
                total: result.estimatedTotalHits || 0,
                page,
                totalPages: Math.ceil((result.estimatedTotalHits || 0) / limit),
                processingTime: result.processingTimeMs
            };
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Search failed' });
        }
    });
}
