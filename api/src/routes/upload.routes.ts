import { FastifyInstance } from 'fastify';
import fs from 'fs';
import util from 'util';
import { pipeline } from 'stream';
import path from 'path';
import crypto from 'crypto';

const pump = util.promisify(pipeline);

export async function uploadRoutes(fastify: FastifyInstance) {
    fastify.post('/upload', async (request, reply) => {
        const data = await request.file();

        if (!data) {
            return reply.code(400).send({ message: 'No file uploaded' });
        }

        // Validate type
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(data.mimetype)) {
            return reply.code(400).send({ message: 'Invalid file type. Only PNG, JPEG, WEBP and GIF are allowed.' });
        }

        // Generate filename
        const ext = path.extname(data.filename);
        const filename = `${crypto.randomUUID()}${ext}`;

        // Ensure uploads directory exists (redundant if server check exists, but safe)
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const savePath = path.join(uploadDir, filename);

        // Save
        await pump(data.file, fs.createWriteStream(savePath));

        // Return URL
        const protocol = request.protocol;
        const host = request.hostname;
        const url = `${protocol}://${host}/uploads/${filename}`;

        return { url };
    });
}
