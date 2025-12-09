import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/db';
import { AuthService } from '../services/auth.service';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { Role } from '../types';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/register', async (request, reply) => {
        const { email, password, role } = request.body as { email: string; password: string; role?: Role };

        if (!email || !password) {
            return reply.code(400).send({ message: 'Email and password are required' });
        }

        // Check existing
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return reply.code(409).send({ message: 'User already exists' });
        }

        const passwordHash = await AuthService.hashPassword(password);

        // Validate role if provided
        let userRole: Role = Role.WRITER;
        if (role && Object.values(Role).includes(role)) {
            userRole = role;
        }

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role: userRole,
            },
        });

        return reply.code(201).send({
            message: 'User registered successfully',
            user: { id: user.id, email: user.email, role: user.role }
        });
    });

    fastify.post('/login', async (request, reply) => {
        const { email, password } = request.body as { email: string; password: string };

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return reply.code(401).send({ message: 'Invalid credentials' });
        }

        const isValid = await AuthService.comparePassword(password, user.passwordHash);
        if (!isValid) {
            return reply.code(401).send({ message: 'Invalid credentials' });
        }

        const token = AuthService.generateToken(user.id, user.role as Role);

        return { token, user: { id: user.id, email: user.email, role: user.role as Role } };
    });

    // Protected route for testing
    fastify.get('/me', { preHandler: [verifyToken] }, async (request, reply) => {
        return request.user;
    });

    // Protected ADMIN route for testing
    fastify.get('/admin', { preHandler: [verifyToken, requireRole([Role.ADMIN])] }, async (request, reply) => {
        return { message: 'Welcome Admin', user: request.user };
    });
}
