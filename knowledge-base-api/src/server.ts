import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth.routes';

dotenv.config();

const server: FastifyInstance = Fastify({
    logger: true
});

// Register plugins
server.register(cors, {
    origin: true
});

server.register(authRoutes, { prefix: '/api/auth' });

// Health check route
server.get('/health', async (request, reply) => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString()
    };
});

const start = async () => {
    try {
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on ${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
