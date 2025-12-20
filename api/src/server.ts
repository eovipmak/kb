import dotenv from 'dotenv';
dotenv.config();

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth.routes';
import { qaRoutes } from './routes/qa.routes';
import { metadataRoutes } from './routes/metadata.routes';
import { searchRoutes } from './routes/search.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { diagnosisRoutes } from './routes/diagnosis.routes';
import { uploadRoutes } from './routes/upload.routes';
import { userRoutes } from './routes/user.routes';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';

const server: FastifyInstance = Fastify({
    logger: true
});

// Register plugins
// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Register plugins
server.register(multipart, {
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

server.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/'
});

server.register(cors, {
    origin: true
});

server.register(rateLimit, {
    global: false
});

server.register(authRoutes, { prefix: '/api/auth' });
server.register(qaRoutes, { prefix: '/api/qa' });
server.register(metadataRoutes, { prefix: '/api' });
server.register(searchRoutes, { prefix: '/api' });
server.register(analyticsRoutes, { prefix: '/api/analytics' });
server.register(diagnosisRoutes, { prefix: '/api/diagnosis-flows' });
server.register(uploadRoutes, { prefix: '/api' });
server.register(userRoutes, { prefix: '/api/users' });

// Health check route
server.get('/health', async (request, reply) => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString()
    };
});

server.get('/api/health', async (request, reply) => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString()
    };
});

import { SearchService } from './services/search.service';

const start = async () => {
    try {
        await SearchService.initIndex();
        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on ${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
