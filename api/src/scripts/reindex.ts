import { prisma } from '../utils/db';
import { SearchService } from '../services/search.service';
import { Status } from '../types';

async function main() {
    console.log('Starting re-indexing...');

    // Initialize search index settings
    await SearchService.initIndex();
    console.log('Search index initialized.');
    // Clear existing index to remove stale articles
    await SearchService.clearIndex();
    console.log('Search index cleared.');

    // Fetch all articles
    const articles = await prisma.qAPage.findMany({
        include: {
            tags: true,
            category: true,
            author: {
                select: { id: true, email: true }
            }
        }
    });

    console.log(`Found ${articles.length} articles in database.`);

    let indexedCount = 0;
    for (const article of articles) {
        if (article.status === Status.PUBLISHED) {
            await SearchService.indexDocument(article);
            indexedCount++;
            console.log(`Indexed: ${article.title}`);
        } else {
            console.log(`Skipped (not published): ${article.title}`);
        }
    }

    console.log(`Re-indexing complete. Total articles indexed: ${indexedCount}`);
    process.exit(0);
}

main().catch(err => {
    console.error('Re-indexing failed:', err);
    process.exit(1);
});
