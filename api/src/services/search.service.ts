import { MeiliSearch, Settings } from 'meilisearch';
import { Status } from '../types';

const MEILI_HOST = process.env.MEILI_HOST || 'http://localhost:7700';
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY || 'your_master_key';

export class SearchService {
    private static client: MeiliSearch;
    private static indexName = 'qa_pages';

    static getClient() {
        if (!this.client) {
            this.client = new MeiliSearch({
                host: MEILI_HOST,
                apiKey: MEILI_MASTER_KEY,
            });
        }
        return this.client;
    }

    static async initIndex() {
        const client = this.getClient();

        try {
            await client.createIndex(this.indexName, { primaryKey: 'id' });
        } catch (e: any) {
            // Ignore if exists, but ensure PK is set
            if (e.code === 'index_already_exists') {
                try {
                    await client.index(this.indexName).update({ primaryKey: 'id' });
                } catch (e) { console.error("SearchService non-fatal:", e); }
            } else {
                console.error("SearchService Init Error (non-fatal):", e.message);
                return;
            }
        }

        try {
            const index = client.index(this.indexName);

            const settings: Settings = {
                searchableAttributes: ["title", "contentText", "tags"],
                filterableAttributes: ["type", "status", "categoryId", "tags"],
                sortableAttributes: ["createdAt", "viewCount"],
                displayedAttributes: ["id", "slug", "title", "contentText", "type", "tags", "category", "createdAt"],
                rankingRules: [
                    "words", "typo", "proximity", "attribute", "sort", "exactness"
                ]
            };

            await index.updateSettings(settings);
        } catch (e) {
            console.error("SearchService Settings Error (non-fatal):", e);
        }
    }

    static async indexDocument(qaPage: any) {
        // Only index if PUBLISHED
        if (qaPage.status !== Status.PUBLISHED) {
            // If it's not published, ensure it's removed (in case it was published before)
            await this.removeDocument(qaPage.id);
            return;
        }

        const client = this.getClient();
        const index = client.index(this.indexName);

        const document = {
            id: qaPage.id,
            slug: qaPage.slug,
            title: qaPage.title,
            contentText: qaPage.contentText,
            type: qaPage.type,
            status: qaPage.status,
            categoryId: qaPage.categoryId,
            category: qaPage.category ? { name: qaPage.category.name, slug: qaPage.category.slug } : null,
            tags: qaPage.tags ? qaPage.tags.map((t: any) => t.name) : [],
            createdAt: qaPage.createdAt ? new Date(qaPage.createdAt).getTime() : Date.now(),
            viewCount: qaPage.viewCount || 0
        };

        try {
            console.log(`Indexing document ${qaPage.id}, status: ${qaPage.status}`);
            const task = await index.addDocuments([document]);
            console.log(`Index task enqueued: ${task.taskUid}`);
        } catch (e) {
            console.error("SearchService Index Error (non-fatal):", e);
        }
    }

    static async removeDocument(qaId: string) {
        try {
            console.log(`Removing document ${qaId}`);
            const client = this.getClient();
            const index = client.index(this.indexName);
            await index.deleteDocument(qaId);
        } catch (e) { console.error("SearchService Remove Error (non-fatal):", e); }
    }

    static async searchDocuments(query: string, filters?: { type?: string[], status?: string[], tags?: string[], categoryId?: string }, page = 1, limit = 20) {
        const client = this.getClient();
        const index = client.index(this.indexName);

        const filterConditions: string[] = [];

        if (filters?.type && filters.type.length > 0) {
            const typeFilters = filters.type.map(t => `type = "${t}"`).join(' OR ');
            filterConditions.push(`(${typeFilters})`);
        }

        if (filters?.status && filters.status.length > 0) {
            const statusFilters = filters.status.map(s => `status = "${s}"`).join(' OR ');
            filterConditions.push(`(${statusFilters})`);
        }

        if (filters?.tags && filters.tags.length > 0) {
            const tagFilters = filters.tags.map(t => `tags = "${t}"`).join(' OR ');
            filterConditions.push(`(${tagFilters})`);
        }

        if (filters?.categoryId) {
            filterConditions.push(`categoryId = "${filters.categoryId}"`);
        }

        return index.search(query, {
            filter: filterConditions.length > 0 ? filterConditions.join(' AND ') : undefined,
            limit,
            offset: (page - 1) * limit
        });
    }

    static async clearIndex() {
        try {
            console.log("Clearing search index...");
            const client = this.getClient();
            const index = client.index(this.indexName);
            await index.deleteAllDocuments();
        } catch (e) {
            console.error("SearchService Clear Error (non-fatal):", e);
        }
    }

    /**
     * Async (fire-and-forget) version of indexDocument
     * Does not block the calling code, executes in background
     */
    static indexDocumentAsync(qaPage: any) {
        setImmediate(async () => {
            try {
                await this.indexDocument(qaPage);
            } catch (e) {
                console.error("SearchService Async Index Error (non-fatal):", e);
            }
        });
    }

    /**
     * Async (fire-and-forget) version of removeDocument
     * Does not block the calling code, executes in background
     */
    static removeDocumentAsync(qaId: string) {
        setImmediate(async () => {
            try {
                await this.removeDocument(qaId);
            } catch (e) {
                console.error("SearchService Async Remove Error (non-fatal):", e);
            }
        });
    }
}
