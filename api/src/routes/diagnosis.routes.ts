import { FastifyInstance } from 'fastify';
import { DiagnosisService } from '../services/diagnosis.service';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { Role } from '../types';

export async function diagnosisRoutes(fastify: FastifyInstance) {
    const createSchema = {
        body: {
            type: 'object',
            required: ['title', 'startNodeId', 'nodes', 'edges'],
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                startNodeId: { type: 'string' },
                nodes: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['id', 'type', 'content'],
                        properties: {
                            id: { type: 'string' },
                            type: { type: 'string', enum: ['question', 'solution'] },
                            content: { type: 'string' },
                            qaPageId: { type: 'string' }
                        }
                    }
                },
                edges: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['from', 'to', 'label'],
                        properties: {
                            from: { type: 'string' },
                            to: { type: 'string' },
                            label: { type: 'string' }
                        }
                    }
                }
            }
        }
    };

    // Create (Admin only)
    fastify.post('/', {
        schema: createSchema,
        preHandler: [verifyToken, requireRole([Role.ADMIN])]
    }, async (request, reply) => {
        const body = request.body as any;
        try {
            const flow = await DiagnosisService.createFlow(body);
            return reply.code(201).send(flow);
        } catch (err: any) {
            request.log.error(err);
            return reply.code(400).send({ message: err.message });
        }
    });

    // List Flows (Public)
    fastify.get('/', async (request, reply) => {
        try {
            const flows = await DiagnosisService.listFlows();
            return flows;
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Get Flow (Public)
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as any;
        try {
            const flow = await DiagnosisService.getFlow(id);
            if (!flow) return reply.code(404).send({ message: 'Not Found' });
            return flow;
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Update (Admin only)
    fastify.put('/:id', {
        schema: { ...createSchema, body: { ...createSchema.body, required: [] } }, // Make fields optional for update if needed, but simplistic reusing
        preHandler: [verifyToken, requireRole([Role.ADMIN])]
    }, async (request, reply) => {
        const { id } = request.params as any;
        const body = request.body as any;
        try {
            const updated = await DiagnosisService.updateFlow(id, body);
            return updated;
        } catch (err: any) {
            if (err.message === 'Not found') return reply.code(404).send({ message: 'Not Found' });
            return reply.code(400).send({ message: err.message });
        }
    });

    // Traversal (Public)
    fastify.get('/:id/node/:nodeId', async (request, reply) => {
        const { id, nodeId } = request.params as any;
        try {
            const result = await DiagnosisService.getTraversal(id, nodeId);
            return result;
        } catch (err: any) {
            if (err.message === 'Flow not found') return reply.code(404).send({ message: 'Flow not found' });
            if (err.message === 'Node not found') return reply.code(404).send({ message: 'Node not found' });
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });
}
