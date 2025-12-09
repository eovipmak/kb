
import { QAService } from '../services/qa.service';
import { SearchService } from '../services/search.service';
import { Status, Role } from '../types';
import { prisma } from '../utils/db';

async function testMeiliSync() {
    console.log('Starting verification...');

    // 0. Init index
    try {
        await SearchService.initIndex();
        console.log('Index initialized.');
    } catch (e) {
        console.error('Error initializing index:', e);
    }

    // 1. Get/Create User
    let authorId = '';
    const user = await prisma.user.findFirst({ where: { role: Role.ADMIN } }); // Get admin to be safe
    if (!user) {
        console.log('Creating dummy admin user...');
        const newUser = await prisma.user.create({
            data: {
                email: `test-admin-${Date.now()}@example.com`,
                passwordHash: 'hashedpassword',
                role: Role.ADMIN
            }
        });
        authorId = newUser.id;
    } else {
        authorId = user.id;
    }

    // 2. Create QA Page
    console.log('Creating QA Page...');
    const created = await QAService.createQAPage({
        title: 'Meilisearch Test',
        contentMarkdown: 'Testing meilisearch sync.',
        tags: ['test', 'meilisearch-sync']
    }, authorId);

    console.log('Created page status:', created.status);

    // Wait for async operations (SearchService.indexDocument is awaited in service, so we refer to that)
    // But Meilisearch indexing is async on the server side (tasks).
    // We need to wait for task to complete?
    // addDocuments returns a Task.
    // The library usually returns a Task object properly.
    // Sync verification requires checking "search" which might be eventually consistent.
    // We'll retry a few times.

    await new Promise(r => setTimeout(r, 1000)); // Wait 1s

    let results = await SearchService.searchDocuments('Meilisearch Test');

    if (created.status === Status.PUBLISHED) {
        if (results.hits.length > 0) console.log('PASS: Created (Published) page indexed.');
        else console.error('FAIL: Created (Published) page NOT indexed.');
    } else {
        if (results.hits.length > 0) console.error('FAIL: Draft page was indexed.');
        else console.log('PASS: Draft page not indexed (Success).');

        // 3. Update to PUBLISHED
        console.log('Updating to PUBLISHED...');
        const updated = await QAService.updateQAPage(created.id, {
            status: Status.PUBLISHED
        }, authorId, Role.ADMIN);

        await new Promise(r => setTimeout(r, 3000)); // Wait for Meilisearch

        results = await SearchService.searchDocuments('Meilisearch Test');
        if (results.hits.length > 0) {
            console.log('PASS: Published page indexed.');
        } else {
            console.error('FAIL: Published page not indexed.', results);
        }
    }

    // 4. Update content
    console.log('Updating content...');
    await QAService.updateQAPage(created.id, {
        title: 'Meilisearch Test Updated'
    }, authorId, Role.ADMIN);

    await new Promise(r => setTimeout(r, 1000));

    results = await SearchService.searchDocuments('Meilisearch Test Updated');
    if (results.hits.length > 0 && results.hits[0].title === 'Meilisearch Test Updated') {
        console.log('PASS: Updated page reflected in index.');
    } else {
        console.error('FAIL: Update not reflected.');
    }

    // 5. Delete
    console.log('Deleting page...');
    await QAService.deleteQAPage(created.id, authorId, Role.ADMIN);

    await new Promise(r => setTimeout(r, 1000));

    results = await SearchService.searchDocuments('Meilisearch Test Updated');
    if (results.hits.length === 0) {
        console.log('PASS: Deleted page removed from index.');
    } else {
        // Even if it fails, maybe check 'Meilisearch Test'
        const oldResults = await SearchService.searchDocuments('Meilisearch Test');
        if (oldResults.hits.length === 0) console.log('PASS: Deleted page removed from index.');
        else console.error('FAIL: Deleted page still in index.');
    }
}

testMeiliSync()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
