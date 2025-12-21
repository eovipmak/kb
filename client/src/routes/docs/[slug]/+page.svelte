<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.css';
	import { browser } from '$app/environment';

	export let data: any;

	let localArticle: any = null;
	let loading = false;
	let fetchError: any = null;

	$: article = data.article || localArticle;

	let contentHtml = '';
	let toc: { id: string; text: string; level: number }[] = [];

	const renderer = new marked.Renderer();
	let tempToc: typeof toc = [];

	// Capture TOC
	renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
		const id = text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-');
		if (depth === 2 || depth === 3) {
			tempToc.push({ id, text, level: depth });
		}
		return `<h${depth} id="${id}">${text}</h${depth}>`;
	};

	// Configure marked
	marked.use({ renderer });

	$: {
		if (article) {
			tempToc = [];
			const rawHtml = marked.parse(article.contentHtml) as string;

			if (browser) {
				contentHtml = DOMPurify.sanitize(rawHtml);
			} else {
				contentHtml = rawHtml;
			}
			toc = tempToc;
		}
	}

	function setupCodeBlocks() {
		document.querySelectorAll('pre code').forEach((block) => {
			hljs.highlightElement(block as HTMLElement);
		});

		document.querySelectorAll('pre').forEach((pre) => {
			if (pre.querySelector('.copy-btn')) return;
			const button = document.createElement('button');
			button.innerText = 'Copy';
			button.className =
				'copy-btn absolute top-2 right-2 bg-gray-700/80 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-200';
			button.setAttribute('aria-label', 'Copy code to clipboard');

			pre.addEventListener('mouseenter', () => (button.style.opacity = '1'));
			pre.addEventListener('mouseleave', () => (button.style.opacity = '0'));

			button.onclick = () => {
				const code = pre.querySelector('code')?.innerText || '';
				navigator.clipboard.writeText(code);
				button.innerText = 'Copied!';
				button.setAttribute('aria-label', 'Code copied to clipboard');
				setTimeout(() => {
					button.innerText = 'Copy';
					button.setAttribute('aria-label', 'Copy code to clipboard');
				}, 2000);
			};

			pre.classList.add('relative', 'group');
			pre.appendChild(button);
		});
	}

	onMount(async () => {
		if (!article && data.slug) {
			loading = true;
			try {
				localArticle = await api.getQABySlug(data.slug);
			} catch (e) {
				console.error(e);
				fetchError = e;
			} finally {
				loading = false;
			}
		}

		if (article) {
			await api.trackView(article.id);
		}
	});

	$: if (contentHtml && browser) {
		setTimeout(setupCodeBlocks, 0);
	}
</script>

<svelte:head>
	{#if article}
		<title>{article.title} - Knowledge Base</title>
		<meta name="description" content={article.title} />
		<meta property="og:title" content={article.title} />
		<meta property="og:type" content="article" />
	{:else}
		<title>Loading... - Knowledge Base</title>
	{/if}
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-12 font-sans">
	<nav
		class="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90"
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
			<div class="flex items-center space-x-2 text-sm text-gray-500">
				<a href="/" class="hover:text-blue-600 transition-colors">Home</a>
				<span>/</span>
				<a href="/docs" class="hover:text-blue-600 transition-colors">Docs</a>
				<span>/</span>
				{#if article}
					<span class="text-gray-900 font-medium truncate max-w-xs">{article.title}</span>
				{:else}
					<span class="text-gray-900 font-medium truncate max-w-xs">...</span>
				{/if}
			</div>
		</div>
	</nav>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-gray-800">
		{#if loading}
			<div class="flex justify-center py-20">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		{:else if fetchError}
			<div
				class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
				role="alert"
			>
				<strong class="font-bold">Error!</strong>
				<span class="block sm:inline"
					>Failed to load article. It might not exist or you don't have permission to view it.</span
				>
			</div>
		{:else if article}
			<div class="lg:grid lg:grid-cols-12 lg:gap-8">
				<article
					class="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
				>
					<div class="p-6 md:p-8">
						<header class="mb-8 border-b border-gray-100 pb-8">
							<div class="flex flex-wrap gap-2 mb-4">
								{#each article.tags as tag}
									<span
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
									>
										{tag.name}
									</span>
								{/each}
							</div>
							<h1
								class="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight"
							>
								{article.title}
							</h1>
							<div class="flex items-center text-sm text-gray-500 space-x-4">
								<span class="flex items-center">
									<svg
										class="w-4 h-4 mr-1 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										></path></svg
									>
									{new Date(article.createdAt).toLocaleDateString()}
								</span>
								<span class="flex items-center">
									<svg
										class="w-4 h-4 mr-1 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										></path><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										></path></svg
									>
									{article.viewCount || 0} views
								</span>
							</div>
						</header>

						<div
							class="prose prose-blue prose-lg max-w-none hover:prose-a:text-blue-600 prose-img:rounded-lg prose-headings:scroll-mt-24"
						>
							{@html contentHtml}
						</div>
					</div>
				</article>

				<aside class="hidden lg:block lg:col-span-4 space-y-6">
					{#if toc.length > 0}
						<div
							class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
						>
							<h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
								Table of Contents
							</h3>
							<nav class="space-y-1">
								{#each toc as item}
									<a
										href="#{item.id}"
										class="block text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded transition-all duration-200 truncate"
										style="padding-left: {(item.level - 2) * 1 +
											0.5}rem; border-left: 2px solid transparent;"
									>
										{item.text}
									</a>
								{/each}
							</nav>
						</div>
					{/if}

					{#if data.related && data.related.length > 0}
						<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
							<h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
								Related Articles
							</h3>
							<ul class="space-y-4">
								{#each data.related as item}
									<li>
										<a href="/docs/{item.slug || 'view?id=' + item.id}" class="block group">
											<h4
												class="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2"
											>
												{item.title}
											</h4>
											<div class="mt-1 flex items-center space-x-2">
												{#if item.tags && item.tags.length > 0}
													<span class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
														>{Array.isArray(item.tags) ? item.tags[0] : item.tags}</span
													>
												{/if}
											</div>
										</a>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</aside>
			</div>
		{/if}
	</main>
</div>

<style>
	:global(.copy-btn) {
		opacity: 0;
	}
	:global(pre:hover .copy-btn) {
		opacity: 1;
	}

	@media print {
		nav,
		aside {
			display: none;
		}
		main {
			padding: 0;
			margin: 0;
		}
		article {
			display: block;
			width: 100%;
			box-shadow: none;
			border: none;
		}
		.prose {
			max-width: none;
		}
	}
</style>
