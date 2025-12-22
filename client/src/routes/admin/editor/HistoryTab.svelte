<script lang="ts">
	import { onMount } from 'svelte';
	import client from '$lib/api/client';

	export let articleId: string;
	export let onRestore: (() => void) | undefined = undefined;

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
	let previewRecord: HistoryRecord | null = null;
	let restoring = false;

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

	const handlePreview = (record: HistoryRecord) => {
		previewRecord = record;
	};

	const closePreview = () => {
		previewRecord = null;
	};

	const handleRestore = async (record: HistoryRecord) => {
		if (
			!confirm(
				`Are you sure you want to restore this version from ${formatDate(record.createdAt)}?`
			)
		) {
			return;
		}

		restoring = true;
		try {
			await client.post(`/qa/${articleId}/restore`, { historyId: record.id });
			alert('Article restored successfully! The page will reload.');

			// Call the callback to reload the editor
			if (onRestore) {
				onRestore();
			} else {
				// Fallback: reload the page
				window.location.reload();
			}
		} catch (e: any) {
			console.error('Failed to restore', e);
			alert('Failed to restore: ' + (e.response?.data?.message || 'Unknown error'));
		} finally {
			restoring = false;
		}
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
				<div
					class="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition"
				>
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
					<div class="flex gap-2 mt-4">
						<button
							on:click={() => handlePreview(record)}
							class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition"
						>
							👁 Preview
						</button>
						<button
							on:click={() => handleRestore(record)}
							disabled={restoring}
							class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if restoring}
								<span class="inline-block animate-spin">⏳</span>
							{:else}
								↶ Restore
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Preview Modal -->
{#if previewRecord}
	<div
		class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
		on:click={closePreview}
		on:keydown={(e) => e.key === 'Escape' && closePreview()}
		role="button"
		tabindex="0"
	>
		<div
			class="bg-gray-900 border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6"
			on:click={(e) => e.stopPropagation()}
			on:keydown={() => {}}
			role="dialog"
			tabindex="-1"
		>
			<div class="flex justify-between items-start mb-4">
				<div>
					<h2 class="text-2xl font-bold text-white mb-2">{previewRecord.oldContent.title}</h2>
					<p class="text-sm text-gray-400">
						Modified by <span class="text-blue-400">{previewRecord.changedBy.email}</span> on {formatDate(
							previewRecord.createdAt
						)}
					</p>
				</div>
				<button
					on:click={closePreview}
					class="text-gray-400 hover:text-white text-2xl leading-none"
					aria-label="Close preview"
				>
					&times;
				</button>
			</div>

			<div class="border-t border-gray-800 pt-4 mt-4">
				<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
					Content Preview
				</h3>
				<div class="prose prose-sm prose-invert max-w-none">
					{@html previewRecord.oldContent.contentHtml}
				</div>
			</div>

			{#if previewRecord.oldContent.tags && previewRecord.oldContent.tags.length > 0}
				<div class="border-t border-gray-800 pt-4 mt-4">
					<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</h3>
					<div class="flex flex-wrap gap-2">
						{#each previewRecord.oldContent.tags as tag}
							<span class="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
								{tag.name}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<div class="flex justify-end gap-2 mt-6">
				<button
					on:click={closePreview}
					class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
				>
					Close
				</button>
				<button
					on:click={() => {
						closePreview();
						handleRestore(previewRecord!);
					}}
					class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition"
				>
					Restore This Version
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.history-container {
		min-height: 400px;
	}

	/* Prose styles for preview */
	:global(.prose-invert) {
		color: #e2e8f0;
	}
	:global(.prose-invert h1) {
		color: #fff;
		font-size: 2em;
		font-weight: bold;
		margin-top: 0;
		margin-bottom: 0.5em;
	}
	:global(.prose-invert h2) {
		color: #f8fafc;
		font-size: 1.5em;
		font-weight: bold;
		margin-top: 1em;
		margin-bottom: 0.5em;
	}
	:global(.prose-invert h3) {
		color: #f1f5f9;
		font-size: 1.25em;
		font-weight: 600;
		margin-top: 1em;
		margin-bottom: 0.5em;
	}
	:global(.prose-invert p) {
		margin-bottom: 1em;
	}
	:global(.prose-invert ul, .prose-invert ol) {
		margin-bottom: 1em;
		padding-left: 1.5em;
	}
	:global(.prose-invert li) {
		margin-bottom: 0.5em;
	}
	:global(.prose-invert code) {
		background-color: #1e293b;
		color: #e2e8f0;
		padding: 0.2em 0.4em;
		border-radius: 0.25em;
		font-size: 0.875em;
	}
	:global(.prose-invert pre) {
		background-color: #0f172a;
		padding: 1em;
		border-radius: 0.5em;
		overflow-x: auto;
		border: 1px solid #1e293b;
	}
	:global(.prose-invert a) {
		color: #60a5fa;
		text-decoration: underline;
	}
	:global(.prose-invert img) {
		max-width: 100%;
		border-radius: 0.5rem;
		border: 1px solid #1e293b;
		margin: 1em 0;
	}
</style>
