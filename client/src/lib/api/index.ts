import client from './client';

export const api = {
	getQABySlug: async (slug: string) => {
		const res = await client.get(`/qa/slug/${slug}`);
		return res.data;
	},
	trackView: async (id: string, metadata?: any) => {
		await client.post(`/analytics/view/${id}`, metadata);
	},
	search: async (params: {
		q: string;
		type?: string;
		category?: string;
		tags?: string;
		page?: number;
		limit?: number;
	}) => {
		const res = await client.get('/search', { params });
		return res.data;
	},
	getPopular: async () => {
		const res = await client.get('/analytics/popular');
		return res.data;
	},
	listQA: async (params?: { status?: string; type?: string; authorId?: string }) => {
		const res = await client.get('/qa', { params });
		return res.data;
	}
};

export default api;
