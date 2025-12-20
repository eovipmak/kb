import { error } from '@sveltejs/kit';
import { api } from '$lib/api';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	try {
		const article = await api.getQABySlug(params.slug);

		let related = [];
		try {
			// 1. First priority: Articles in the same category
			const catRes = await api.search({ categoryId: article.categoryId, q: '', limit: 10 });
			const catHits = Array.isArray(catRes) ? catRes : catRes.hits || [];

			// 2. Second priority: Search by title keywords
			const searchRes = await api.search({ q: article.title, limit: 10 });
			const searchHits = Array.isArray(searchRes) ? searchRes : searchRes.hits || [];

			// Combine and filter
			const results = [...catHits, ...searchHits];
			const uniqueMap = new Map();
			results.forEach((a: any) => {
				if (a.id !== article.id && a.slug !== article.slug) {
					uniqueMap.set(a.id, a);
				}
			});

			related = Array.from(uniqueMap.values()).slice(0, 5);
		} catch (e) {
			console.error('Failed to load related articles', e);
		}

		return { article, related };
	} catch (e: any) {
		// Rethrow SvelteKit redirects or errors
		if (e?.status && e?.location) throw e;
		if (e?.status && typeof e.status === 'number' && e.body?.message) throw e;

		// If SSR fails (likely due to missing auth for drafts), return partial data
		// so the client can try again with proper auth tokens
		if (!browser) {
			console.log('SSR fetch failed (probably draft), falling back to client-side fetch', e);
			return { article: null, slug: params.slug };
		}

		console.error(e);
		throw error(404, 'Article not found');
	}
};
