<script lang="ts">
	import { onMount } from 'svelte';
	import client from '$lib/api/client';

	export let articleId: string;

	interface HistoryRecord {
		id: string;
		articleId: string;
		changedBy: {
			id: string;
			email: string;
			role: string;
		};
		oldContent: {
			title: string;
			contentHtml: string;
			status: string;
			type: string;
			tags: Array<{ id: string; name: string }>;
		};
		createdAt: string;
	}

	let history: HistoryRecord[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		try {
			const res = await client.get(`/qa/${articleId}/history`);
			history = res.data;
		} catch (e: any) {
			if (e.response?.status === 404) {
				error = 'Article not found';
			} else if (e.response?.status === 403) {
				error = 'You do not have permission to view this history';
			} else {
				error = 'Failed to load history';
			}
			console.error('Failed to load history', e);
		} finally {
			loading = false;
		}
	});

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};
</script>

<div class="history-container">
	{#if loading}
		<div class="text-center py-8 text-gray-400">
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
			<p class="mt-2">Loading history...</p>
		</div>
	{:else if error}
		<div class="text-center py-8 text-red-400">
			<p>{error}</p>
		</div>
	{:else if history.length === 0}
		<div class="text-center py-8 text-gray-500">
			<p>No history available yet.</p>
			<p class="text-sm mt-2">History will be recorded when this article is updated.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each history as record}
				<div class="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition">
					<div class="flex justify-between items-start mb-2">
						<div>
							<p class="text-sm font-medium text-gray-300">
								Modified by: <span class="text-blue-400">{record.changedBy.email}</span>
							</p>
							<p class="text-xs text-gray-500 mt-1">
								{formatDate(record.createdAt)}
							</p>
						</div>
						<span
							class="px-2 py-1 text-xs rounded {record.oldContent.status === 'PUBLISHED'
								? 'bg-emerald-900 text-emerald-300'
								: record.oldContent.status === 'REVIEW'
									? 'bg-blue-900 text-blue-300'
									: 'bg-gray-700 text-gray-300'}"
						>
							{record.oldContent.status}
						</span>
					</div>
					<div class="border-t border-gray-800 pt-3 mt-3">
						<p class="text-sm text-gray-400 font-medium mb-1">Previous Title:</p>
						<p class="text-gray-300">{record.oldContent.title}</p>
						{#if record.oldContent.tags && record.oldContent.tags.length > 0}
							<div class="mt-2">
								<p class="text-sm text-gray-400 font-medium mb-1">Tags:</p>
								<div class="flex flex-wrap gap-2">
									{#each record.oldContent.tags as tag}
										<span class="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
											{tag.name}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.history-container {
		min-height: 400px;
	}
</style>
