import { FastifyInstance } from 'fastify';
import { analyticsService } from '../services/analytics.service';

export async function analyticsRoutes(fastify: FastifyInstance) {

    // Track view
    fastify.post('/view/:id', async (request, reply) => {
        const { id } = request.params as any;
        const body = request.body as any || {}; // Body might be optional or contain referrer/userAgent

        try {
            // metadata is optional, but we pass it as requested
            const metadata = {
                referrer: body.referrer,
                userAgent: body.userAgent
            };

            await analyticsService.trackView(id, metadata);
            // Requirement says "viewCount aument" but doesn't specify return body.
            // Usually returns success or updated count. 
            // "Acceptance Criteria: ... -> viewCount aument" could mean verified by next step.
            return { success: true };
        } catch (err: any) {
            // If ID not found, prisma might throw.
            if (err.code === 'P2025') { // Prisma record not found code
                return reply.code(404).send({ message: 'Not Found' });
            }
            request.log.error(err);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Get popular pages
    fastify.get('/popular', async (request, reply) => {
        // limit could be a query param
        const query = request.query as any;
        const limit = query.limit ? parseInt(query.limit) : 10;

        try {
            const pages = await analyticsService.getPopularPages(limit);
            return pages;
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });
}
