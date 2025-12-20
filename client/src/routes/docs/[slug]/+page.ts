import { error } from '@sveltejs/kit';
import { api } from '$lib/api';

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
	} catch (e) {
		console.error(e);
		throw error(404, 'Article not found');
	}
};
