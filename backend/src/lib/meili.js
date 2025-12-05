// backend/src/lib/meili.js
const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey',
});

// Helper to safely index only if server is up
async function indexDocument(indexName, document) {
  try {
    const index = client.index(indexName);
    await index.addDocuments([document]);
  } catch (error) {
    console.error(`Meilisearch indexing failed for ${indexName}:`, error.message);
  }
}

module.exports = { client, indexDocument };
