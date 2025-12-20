
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backup() {
    console.log('Starting full backup...');

    const users = await prisma.user.findMany();
    const tags = await prisma.tag.findMany();
    const categories = await prisma.category.findMany();

    // Include tags relation!
    const qaPages = await prisma.qAPage.findMany({
        include: {
            tags: true
        }
    });

    const diagnosisFlows = await prisma.diagnosisFlow.findMany();

    const data = {
        users,
        tags,
        categories,
        qaPages,
        diagnosisFlows
    };

    const backupPath = path.join(__dirname, '../../backup_data_full.json');
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

    console.log(`Full backup saved to ${backupPath}`);
}

backup()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
