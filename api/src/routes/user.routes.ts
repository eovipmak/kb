import { FastifyInstance } from 'fastify';
import { UserService } from '../services/user.service';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { Role } from '../types';

export async function userRoutes(fastify: FastifyInstance) {
    // All routes require ADMIN role
    const adminOnly = [verifyToken, requireRole([Role.ADMIN])];

    // Get all users
    fastify.get('/', {
        preHandler: adminOnly
    }, async (request, reply) => {
        try {
            const users = await UserService.getAllUsers();
            return reply.code(200).send(users);
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Create new user
    fastify.post('/', {
        preHandler: adminOnly,
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password', 'role'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    role: { type: 'string', enum: Object.values(Role) }
                }
            }
        }
    }, async (request, reply) => {
        const { email, password, role } = request.body as { email: string; password: string; role: Role };

        try {
            const user = await UserService.createUser(email, password, role);
            return reply.code(201).send(user);
        } catch (err: any) {
            request.log.error(err);
            if (err.message === 'User already exists') {
                return reply.code(409).send({ message: err.message });
            }
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Update user
    fastify.put('/:id', {
        preHandler: adminOnly,
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    role: { type: 'string', enum: Object.values(Role) },
                    password: { type: 'string', minLength: 6 }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const data = request.body as { role?: Role; password?: string };

        try {
            const user = await UserService.updateUser(id, data);
            return reply.code(200).send(user);
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });

    // Delete user
    fastify.delete('/:id', {
        preHandler: adminOnly,
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            await UserService.deleteUser(id);
            return reply.code(204).send();
        } catch (err) {
            request.log.error(err);
            return reply.code(500).send({ message: 'Internal Server Error' });
        }
    });
}
