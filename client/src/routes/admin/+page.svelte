<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import client from '$lib/api/client';
	import PreviewModal from './PreviewModal.svelte';

	let stats = {
		articles: 0,
		users: 0,
		views: 0
	};
	let recentArticles: any[] = [];
	let loading = true;
	let showModal = false;
	let selectedArticle: any = null;

	onMount(async () => {
		const token = localStorage.getItem('token');
		if (!token) {
			goto('/login');
			return;
		}

		try {
			const [statsRes, articlesRes] = await Promise.all([
				client.get('/analytics/stats'),
				client.get('/qa', { params: { limit: 10 } })
			]);
			stats = statsRes.data;
			recentArticles = articlesRes.data;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	});

	function getStatusColor(status: string) {
		switch (status) {
			case 'PUBLISHED':
				return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
			case 'DRAFT':
				return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
			case 'REVIEW':
				return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
			default:
				return 'bg-slate-100 text-slate-700';
		}
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
	<div class="max-w-7xl mx-auto space-y-8">
		<header
			class="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4"
		>
			<div>
				<h1
					class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
				>
					Admin Dashboard
				</h1>
				<p class="text-gray-500 dark:text-gray-400 mt-1">Manage your knowledge base and users</p>
			</div>
			<div class="flex gap-4">
				<a
					href="/admin/editor"
					class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-lg shadow-blue-500/20"
				>
					+ New Article
				</a>
			</div>
		</header>

		{#if loading}
			<div class="flex justify-center py-20">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		{:else}
			<!-- Stats Grid -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div
					class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
				>
					<h3
						class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
					>
						Total Articles
					</h3>
					<p class="text-3xl font-bold mt-2">{stats.articles}</p>
				</div>
				<div
					class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
				>
					<h3
						class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
					>
						Total Users
					</h3>
					<p class="text-3xl font-bold mt-2">{stats.users}</p>
				</div>
				<div
					class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
				>
					<h3
						class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
					>
						Total Views
					</h3>
					<p class="text-3xl font-bold mt-2">{stats.views}</p>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Article List -->
				<div
					class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
				>
					<div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
						<h2 class="text-xl font-bold">Recent Articles</h2>
						<a href="/docs" class="text-sm text-blue-600 hover:underline">View Public List →</a>
					</div>
					<div class="overflow-x-auto">
						<table class="w-full text-left border-collapse">
							<thead>
								<tr class="bg-gray-50 dark:bg-gray-700/50">
									<th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
									<th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
									<th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-100 dark:divide-gray-700">
								{#each recentArticles as article}
									<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
										<td class="px-6 py-4">
											<div class="font-medium text-gray-900 dark:text-white">{article.title}</div>
											<div class="text-xs text-gray-500 mt-0.5">{article.category?.name || 'Uncategorized'}</div>
										</td>
										<td class="px-6 py-4">
											<span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider {getStatusColor(article.status)}">
												{article.status}
											</span>
										</td>
										<td class="px-6 py-4 text-right space-x-3">
											<button 
												on:click={() => {
													selectedArticle = article;
													showModal = true;
												}}
												class="text-gray-500 hover:text-blue-600 font-medium text-sm bg-transparent border-none cursor-pointer"
											>
												{#if article.status === 'DRAFT'}Preview{:else}View{/if}
											</button>
											<a 
												href="/admin/editor?id={article.id}" 
												class="text-blue-600 hover:text-blue-700 font-medium text-sm"
											>
												Edit
											</a>
										</td>
									</tr>
								{/each}
								{#if recentArticles.length === 0}
									<tr>
										<td colspan="3" class="px-6 py-10 text-center text-gray-500">
											No articles found. Seed the database or create a new one.
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</div>

				<!-- Quick Links -->
				<div class="space-y-8">
					<div
						class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
					>
						<div class="p-6 border-b border-gray-100 dark:border-gray-700">
							<h2 class="text-xl font-bold">Quick Actions</h2>
						</div>
						<div class="p-6 grid gap-4">
							<a
								href="/admin/editor"
								class="block p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
							>
								<span class="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400"
									>Create New Article</span
								>
								<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
									Write a new FAQ or Troubleshooting guide
								</p>
							</a>
							<div
								class="block p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 opacity-60 cursor-not-allowed"
							>
								<span class="font-semibold">Manage Users</span>
								<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Coming soon...</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if showModal}
	<PreviewModal 
		article={selectedArticle} 
		on:close={() => showModal = false} 
	/>
{/if}
