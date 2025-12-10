import { error } from '@sveltejs/kit';
import { api } from '$lib/api';

export const load = async ({ params }) => {
    try {
        const article = await api.getQABySlug(params.slug);

        let related = [];
        try {
            // Search for related articles using the title
            const searchRes = await api.search(article.title, 5);
            // safe check for searchRes structure (results or array)
            const results = Array.isArray(searchRes) ? searchRes : (searchRes.hits || []);
            related = results.filter((a: any) => a.id !== article.id);
        } catch (e) {
            console.error("Failed to load related articles", e);
        }

        return { article, related };
    } catch (e) {
        console.error(e);
        throw error(404, 'Article not found');
    }
};
