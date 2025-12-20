<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
	import { onMount } from 'svelte';
	import DOMPurify from 'dompurify';
	import { marked } from 'marked';

	interface Article {
		id: string;
		title: string;
		slug: string;
		type: string;
		tags: string[];
		createdAt: string;
		content: string;
	}

	// State
	let loading = false;
	let results: Article[] = [];
	let popularArticles: Article[] = [];
	let total = 0;
	let limit = 10;

	// Filter definitions
	const TYPES = ['FAQ', 'TROUBLESHOOTING', 'TUTORIAL', 'General'];
	const CATEGORIES = ['General', 'Installation', 'Configuration', 'Security', 'Network'];
	const COMMON_TAGS = ['nginx', 'apache', 'linux', 'error', 'database', 'ssh', 'ssl'];

	// Reactive values from URL
	$: query = $page.url.searchParams.get('q') || '';
	$: type = $page.url.searchParams.get('type') || '';
	$: category = $page.url.searchParams.get('category') || '';
	$: tagsParam = $page.url.searchParams.get('tags');
	$: selectedTags = tagsParam ? tagsParam.split(',') : [];
	$: pageNum = parseInt($page.url.searchParams.get('page') || '1');

	// Debounced search input
	let searchInput = '';
	let inputEl: HTMLInputElement;
	let debounceTimer: ReturnType<typeof setTimeout>;

	// Initialize searchInput from query on load/nav
	$: if (query !== searchInput && !debounceTimer) searchInput = query;

	function handleInput(e: Event) {
		searchInput = (e.target as HTMLInputElement).value;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			updateUrl({ q: searchInput, page: 1 });
		}, 300);
	}

	function handleClear() {
		searchInput = '';
		clearTimeout(debounceTimer);
		updateUrl({ q: '', page: 1 });
		inputEl?.focus();
	}

	// Search Execution
	$: {
		(async () => {
			loading = true;
			try {
				// If we have query or filters, search. Otherwise, maybe clear results?
				// User requirement: "No results found" with suggestions if empty search?
				// If no query and no filters, page might be empty or show recent/popular.

				const hasFilters = query || type || category || selectedTags.length > 0;

				if (hasFilters) {
					const res = await api.search({
						q: query,
						type: type || undefined,
						category: category || undefined,
						tags: tagsParam || undefined,
						page: pageNum,
						limit
					});
					// Adjust based on actual API response format (array vs object)
					if (Array.isArray(res)) {
						results = res;
						total = res.length; // Approximate if meta missing
					} else {
						results = res.data || [];
						total = res.meta?.total || 0;
					}
				} else {
					results = [];
					total = 0;
				}
			} catch (err) {
				console.error('Search error:', err);
				results = [];
			} finally {
				loading = false;
			}
		})();
	}

	onMount(async () => {
		try {
			const pop = await api.getPopular();
			popularArticles = Array.isArray(pop) ? pop : pop.data || [];
		} catch (e) {
			console.error('Failed to load popular:', e);
		}
	});

	function updateUrl(changes: {
		q?: string;
		type?: string;
		category?: string;
		tags?: string[];
		page?: number;
	}) {
		const url = new URL($page.url);

		if (changes.q !== undefined)
			changes.q ? url.searchParams.set('q', changes.q) : url.searchParams.delete('q');
		if (changes.type !== undefined)
			changes.type ? url.searchParams.set('type', changes.type) : url.searchParams.delete('type');
		if (changes.category !== undefined)
			changes.category
				? url.searchParams.set('category', changes.category)
				: url.searchParams.delete('category');
		if (changes.tags !== undefined)
			changes.tags.length
				? url.searchParams.set('tags', changes.tags.join(','))
				: url.searchParams.delete('tags');
		if (changes.page !== undefined) url.searchParams.set('page', changes.page.toString());

		goto(url, { keepFocus: true, noScroll: true });
	}

	// Filter Handlers
	function toggleType(t: string) {
		updateUrl({ type: type === t ? '' : t, page: 1 });
	}

	function setCategory(c: string) {
		updateUrl({ category: c, page: 1 });
	}

	function toggleTag(t: string) {
		const newTags = selectedTags.includes(t)
			? selectedTags.filter((tag: string) => tag !== t)
			: [...selectedTags, t];
		updateUrl({ tags: newTags, page: 1 });
	}

	function goToPage(p: number) {
		updateUrl({ page: p });
	}

	// Syntax Highlight Helper
	function highlight(text: string, term: string) {
		if (!term) return text;
		const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regex = new RegExp(`(${escaped})`, 'gi');
		return text.replace(regex, '<mark class="bg-yellow-200 text-slate-900 rounded-sm">$1</mark>');
	}

	function getSnippet(content: string, term: string) {
		if (!content) return '';
		// Convert markdown to plain text for snippet
		// Using basic strip, marked might be overkill purely for stripping but safer
		const tokens = marked.lexer(content);
		const plainText = tokens
			.filter((t: any) => t.type === 'paragraph' || t.type === 'text')
			.map((t: any) => t.text)
			.join(' ');

		if (!term) return plainText.slice(0, 200) + (plainText.length > 200 ? '...' : '');

		const index = plainText.toLowerCase().indexOf(term.toLowerCase());
		if (index === -1) return plainText.slice(0, 200) + '...';

		const start = Math.max(0, index - 60);
		const end = Math.min(plainText.length, index + 140);
		return (
			(start > 0 ? '...' : '') + plainText.slice(start, end) + (end < plainText.length ? '...' : '')
		);
	}
</script>

<div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-6">
	<!-- Header / Search Bar -->
	<div class="max-w-7xl mx-auto w-full mb-8">
		<h1 class="text-3xl font-bold mb-6 text-slate-800 tracking-tight">Search Knowledge Base</h1>
		<div class="relative w-full max-w-3xl">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<svg
					class="h-5 w-5 text-slate-400"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<input
				bind:this={inputEl}
				type="text"
				class="block w-full pl-10 pr-12 py-4 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-lg shadow-sm"
				placeholder="Search articles (e.g. nginx, error 500)..."
				value={searchInput}
				on:input={handleInput}
			/>
			<div class="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
				{#if searchInput}
					<button
						type="button"
						aria-label="Clear search"
						class="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-slate-600"
						on:click={handleClear}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="w-5 h-5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
				{#if loading}
					<svg
						class="animate-spin h-5 w-5 text-blue-500"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				{/if}
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8">
		<!-- Filters Sidebar -->
		<aside class="w-full md:w-64 flex-shrink-0 space-y-8">
			<!-- Type Filter -->
			<div>
				<h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Type</h3>
				<div class="space-y-2">
					{#each TYPES as t}
						<label class="flex items-center">
							<input
								type="checkbox"
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
								checked={type === t}
								on:change={() => toggleType(t)}
							/>
							<span class="ml-3 text-slate-700">{t}</span>
						</label>
					{/each}
				</div>
			</div>

			<!-- Category Filter -->
			<div>
				<h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Category</h3>
				<select
					class="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
					value={category}
					on:change={(e) => setCategory((e.target as HTMLSelectElement).value)}
				>
					<option value="">All Categories</option>
					{#each CATEGORIES as c}
						<option value={c}>{c}</option>
					{/each}
				</select>
			</div>

			<!-- Tags Filter -->
			<div>
				<h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Tags</h3>
				<div class="flex flex-wrap gap-2">
					{#each COMMON_TAGS as t}
						<button
							type="button"
							aria-pressed={selectedTags.includes(t)}
							class="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-200 {selectedTags.includes(
								t
							)
								? 'bg-blue-100 text-blue-800 border-blue-200'
								: 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}"
							on:click={() => toggleTag(t)}
						>
							{t}
						</button>
					{/each}
				</div>
			</div>
		</aside>

		<!-- Results Area -->
		<div class="flex-1">
			{#if loading}
				<div class="space-y-6 animate-pulse">
					{#each Array(5) as _}
						<div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
							<div class="flex items-center space-x-2 mb-4">
								<div class="h-4 bg-slate-200 rounded w-16"></div>
								<div class="h-4 bg-slate-200 rounded w-24"></div>
							</div>
							<div class="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
							<div class="space-y-2 mb-6">
								<div class="h-4 bg-slate-200 rounded w-full"></div>
								<div class="h-4 bg-slate-200 rounded w-5/6"></div>
							</div>
							<div class="flex gap-2">
								<div class="h-5 w-16 bg-slate-200 rounded"></div>
								<div class="h-5 w-16 bg-slate-200 rounded"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if results.length > 0}
				<div class="space-y-6">
					{#each results as result (result.id || result.slug)}
						<article
							class="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200"
						>
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center space-x-2">
									<span
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
									>
										{result.type}
									</span>
									<span class="text-sm text-slate-500">
										{new Date(result.createdAt).toLocaleDateString()}
									</span>
								</div>
							</div>
							<h2 class="text-xl font-bold text-slate-900 mb-2">
								<a href={`/docs/${result.slug}`} class="hover:text-blue-600 hover:underline">
									{@html highlight(result.title, query)}
								</a>
							</h2>
							<p class="text-slate-600 mb-4 text-sm leading-relaxed">
								{@html highlight(getSnippet(result.content, query), query)}
							</p>
							<div class="flex flex-wrap gap-2">
								{#if result.tags}
									{#each result.tags as tag}
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
										>
											#{tag}
										</span>
									{/each}
								{/if}
							</div>
						</article>
					{/each}
				</div>

				<!-- Pagination -->
				{#if total > limit}
					<div class="mt-8 flex justify-center space-x-2">
						<button
							class="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={pageNum === 1}
							on:click={() => goToPage(pageNum - 1)}
						>
							Previous
						</button>
						<span class="px-4 py-2 text-sm text-slate-600 self-center">
							Page {pageNum}
						</span>
						<button
							class="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={results.length < limit}
							on:click={() => goToPage(pageNum + 1)}
						>
							Next
						</button>
					</div>
				{/if}
			{:else if query || type || category || selectedTags.length > 0}
				<!-- Empty State with Filter -->
				<div class="text-center py-12">
					<svg
						class="mx-auto h-12 w-12 text-slate-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-slate-900">No results found</h3>
					<p class="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>

					{#if popularArticles.length > 0}
						<div class="mt-8 text-left max-w-lg mx-auto">
							<h4 class="text-sm font-semibold text-slate-900 mb-4">Popular Articles</h4>
							<ul class="divide-y divide-slate-200">
								{#each popularArticles.slice(0, 3) as article}
									<li class="py-3">
										<a
											href={`/docs/${article.slug}`}
											class="group flex items-center justify-between"
										>
											<span
												class="text-sm text-slate-700 group-hover:text-blue-600 transition-colors"
												>{article.title}</span
											>
											<svg
												class="h-4 w-4 text-slate-400 group-hover:text-blue-500"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 5l7 7-7 7"
												/>
											</svg>
										</a>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Initial State / Empty State without query -->
				<div class="text-center py-12">
					<h3 class="mt-2 text-lg font-medium text-slate-900">Start searching to find answers</h3>
					<p class="mt-1 text-sm text-slate-500">
						Type keywords or select filters to browse the knowledge base.
					</p>

					{#if popularArticles.length > 0}
						<div class="mt-10 text-left max-w-2xl mx-auto">
							<h4 class="text-lg font-semibold text-slate-900 mb-4">Popular Articles</h4>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{#each popularArticles as article}
									<a
										href={`/docs/${article.slug}`}
										class="relative rounded-lg border border-slate-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-slate-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
									>
										<div class="flex-1 min-w-0">
											<span class="absolute inset-0" aria-hidden="true"></span>
											<p class="text-sm font-medium text-slate-900">{article.title}</p>
											<p class="text-sm text-slate-500 truncate">
												{article.type} &bull; {new Date(article.createdAt).toLocaleDateString()}
											</p>
										</div>
									</a>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
