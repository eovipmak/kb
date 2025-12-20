
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restore() {
    console.log('Starting restore (full)...');
    const backupPath = path.join(__dirname, '../../backup_data_full.json');

    if (!fs.existsSync(backupPath)) {
        console.log('No backup file found. Skipping restore.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    // Clean existing tables
    try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "QAPage", "Tag", "Category", "DiagnosisFlow", "_QAPageToTag" CASCADE;`);
    } catch (e) {
        console.log('Error cleaning tables, continuing...', e);
    }

    // 1. Users
    console.log(`Restoring ${data.users.length} users...`);
    for (const user of data.users) {
        await prisma.user.create({ data: user });
    }

    // 2. Tags
    console.log(`Restoring ${data.tags.length} tags...`);
    for (const tag of data.tags) {
        await prisma.tag.create({ data: tag });
    }

    // 3. Categories
    console.log(`Restoring ${data.categories.length} categories...`);
    for (const cat of data.categories) {
        await prisma.category.create({ data: cat });
    }

    // 4. QAPages
    console.log(`Restoring ${data.qaPages.length} qaPages...`);
    for (const page of data.qaPages) {
        const { contentMarkdown, tags, ...rest } = page;

        // Map contentMarkdown -> contentHtml
        // Connect tags using IDs
        const pageData = {
            ...rest,
            contentHtml: contentMarkdown || '',
            tags: {
                connect: tags ? tags.map((t: any) => ({ id: t.id })) : []
            }
        };

        await prisma.qAPage.create({
            data: pageData,
        });
    }

    // 5. DiagnosisFlows
    console.log(`Restoring ${data.diagnosisFlows.length} flows...`);
    for (const flow of data.diagnosisFlows) {
        await prisma.diagnosisFlow.create({ data: flow });
    }

    console.log('Restore completed successfully.');
}

restore()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
