import { FastifyInstance } from 'fastify';
import { MetadataService } from '../services/metadata.service';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { Role } from '../types';

export async function metadataRoutes(fastify: FastifyInstance) {
    // Tags Routes
    fastify.post('/tags', {
        preHandler: [verifyToken, requireRole([Role.ADMIN])]
    }, async (request, reply) => {
        const { name } = request.body as { name: string };
        try {
            const tag = await MetadataService.createTag(name);
            return reply.code(201).send(tag);
        } catch (err: any) {
            return reply.code(500).send({ message: err.message || 'Internal Server Error' });
        }
    });

    fastify.get('/tags', async (request, reply) => {
        try {
            const tags = await MetadataService.listAllTags();
            return tags;
        } catch (err) {
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Categories Routes
    fastify.post('/categories', {
        preHandler: [verifyToken, requireRole([Role.ADMIN])]
    }, async (request, reply) => {
        const { name, slug } = request.body as { name: string; slug: string };
        try {
            const category = await MetadataService.createCategory(name, slug);
            return reply.code(201).send(category);
        } catch (err: any) {
            if (err.message.includes('Invalid slug')) {
                return reply.code(400).send({ message: err.message });
            }
            // Handle unique constraint violation
            if (err.code === 'P2002') {
                return reply.code(409).send({ message: 'Category already exists' });
            }
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    fastify.get('/categories', async (request, reply) => {
        try {
            const categories = await MetadataService.listAllCategories();
            return categories;
        } catch (err) {
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });
}
