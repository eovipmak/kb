import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { Role } from '@prisma/client';

// Extend FastifyRequest to include user
declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: string;
            role: Role;
        };
    }
}

export const verifyToken = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return reply.code(401).send({ message: 'No token provided' });
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            return reply.code(401).send({ message: 'No token provided' });
        }

        // Since verifyToken in AuthService returns string | JwtPayload, we cast or check
        const decoded = AuthService.verifyToken(token) as { id: string; role: Role };
        request.user = decoded;
    } catch (err) {
        return reply.code(401).send({ message: 'Unauthorized: Invalid token' });
    }
};

export const requireRole = (allowedRoles: Role[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user;
        if (!user) {
            return reply.code(401).send({ message: 'Unauthorized for this user' });
        }
        if (!allowedRoles.includes(user.role)) {
            return reply.code(403).send({ message: 'Forbidden: Insufficient permissions' });
        }
    };
};
