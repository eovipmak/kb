import { FastifyInstance } from 'fastify';
import { QAService } from '../services/qa.service';
import { WorkflowService } from '../services/workflow.service';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';
import { Role, PageType, Status } from '../types';

export async function qaRoutes(fastify: FastifyInstance) {
    // Schemas
    const createSchema = {
        body: {
            type: 'object',
            required: ['title', 'contentMarkdown'],
            properties: {
                title: { type: 'string', minLength: 10 },
                contentMarkdown: { type: 'string', minLength: 50 },
                type: { type: 'string', enum: Object.values(PageType) },
                tags: { type: 'array', items: { type: 'string' } },
                categoryId: { type: 'string' }
            }
        }
    };

    const updateSchema = {
        body: {
            type: 'object',
            properties: {
                title: { type: 'string', minLength: 10 },
                contentMarkdown: { type: 'string', minLength: 50 },
                status: { type: 'string', enum: Object.values(Status) },
                type: { type: 'string', enum: Object.values(PageType) },
                tags: { type: 'array', items: { type: 'string' } },
                categoryId: { type: 'string' }
            }
        }
    };

    // Create
    fastify.post('/', {
        schema: createSchema,
        preHandler: [verifyToken, requireRole([Role.WRITER, Role.ADMIN])]
    }, async (request, reply) => {
        const body = request.body as any;
        try {
            const page = await QAService.createQAPage(body, request.user!.id);
            return reply.code(201).send(page);
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Get List
    fastify.get('/', async (request, reply) => {
        const query = request.query as any;
        try {
            const pages = await QAService.listQAPages({
                status: query.status,
                type: query.type,
                authorId: query.authorId
            });
            return pages;
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Get ID
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as any;
        let userId: string | undefined;
        let userRole: Role | undefined;

        const authHeader = request.headers.authorization;
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const decoded = AuthService.verifyToken(token);
                userId = decoded.id;
                userRole = decoded.role;
            } catch (err) {
                return reply.code(401).send({ message: 'Invalid token' });
            }
        }

        try {
            const page = await QAService.getQAPageById(id, userId, userRole);
            if (!page) return reply.code(404).send({ message: 'Not Found' });
            return page;
        } catch (err: any) {
            if (err.message === 'Forbidden') return reply.code(403).send({ message: 'Forbidden' });
            if (err.message === 'Unauthorized') return reply.code(401).send({ message: 'Unauthorized' }); // Log in to view draft
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Update
    fastify.put('/:id', {
        schema: updateSchema,
        preHandler: [verifyToken]
    }, async (request, reply) => {
        const { id } = request.params as any;
        const body = request.body as any;

        try {
            const updated = await QAService.updateQAPage(id, body, request.user!.id, request.user!.role);
            return updated;
        } catch (err: any) {
            if (err.message.includes('Forbidden')) return reply.code(403).send({ message: err.message });
            if (err.message === 'Not found') return reply.code(404).send({ message: 'Not Found' });
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Delete
    fastify.delete('/:id', {
        preHandler: [verifyToken]
    }, async (request, reply) => {
        const { id } = request.params as any;
        try {
            await QAService.deleteQAPage(id, request.user!.id, request.user!.role);
            return reply.code(204).send();
        } catch (err: any) {
            if (err.message === 'Forbidden') return reply.code(403).send({ message: 'Forbidden' });
            if (err.message === 'Not found') return reply.code(404).send({ message: 'Not Found' });
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Publish (Admin only)
    fastify.post('/:id/publish', {
        preHandler: [verifyToken, requireRole([Role.ADMIN])]
    }, async (request, reply) => {
        const { id } = request.params as any;
        try {
            const page = await WorkflowService.transitionStatus(id, Status.PUBLISHED, request.user!.id, request.user!.role);
            return page;
        } catch (err: any) {
            if (err.message.includes('Forbidden')) return reply.code(403).send({ message: err.message });
            if (err.message === 'Not found') return reply.code(404).send({ message: 'Not Found' });
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Reject (Admin only)
    fastify.post('/:id/reject', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    reason: { type: 'string' }
                }
            }
        },
        preHandler: [verifyToken, requireRole([Role.ADMIN])]
    }, async (request, reply) => {
        const { id } = request.params as any;
        // Body with reason is optional for logic but part of spec
        try {
            const page = await WorkflowService.transitionStatus(id, Status.DRAFT, request.user!.id, request.user!.role);
            return page;
        } catch (err: any) {
            if (err.message.includes('Forbidden')) return reply.code(403).send({ message: err.message });
            if (err.message === 'Not found') return reply.code(404).send({ message: 'Not Found' });
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });
}
