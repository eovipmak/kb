<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.css';

	export let article: any;

	const dispatch = createEventDispatcher();
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

	marked.use({ renderer });

	$: if (article) {
		tempToc = [];
		const rawHtml = marked.parse(article.contentHtml || '') as string;
		contentHtml = DOMPurify.sanitize(rawHtml);
		toc = tempToc;

		// Defer highlighting
		setTimeout(() => {
			document.querySelectorAll('.preview-content pre code').forEach((block) => {
				hljs.highlightElement(block as HTMLElement);
			});
		}, 0);
	}

	function close() {
		dispatch('close');
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'PUBLISHED':
				return 'bg-emerald-100 text-emerald-700';
			case 'DRAFT':
				return 'bg-gray-100 text-gray-700';
			case 'REVIEW':
				return 'bg-amber-100 text-amber-700';
			default:
				return 'bg-slate-100 text-slate-700';
		}
	}
</script>

<div
	class="fixed inset-0 z-50 overflow-y-auto"
	aria-labelledby="modal-title"
	role="dialog"
	aria-modal="true"
>
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
		on:click={close}
		on:keydown={(e) => e.key === 'Escape' && close()}
		role="button"
		tabindex="0"
	></div>

	<div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
		<div
			class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl max-h-[90vh] flex flex-col"
		>
			<!-- Header -->
			<div class="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center border-b">
				<h3 class="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
					Preview Article
				</h3>
				<button
					type="button"
					class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
					on:click={close}
				>
					<span class="sr-only">Close</span>
					<svg
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="px-4 py-5 sm:p-6 overflow-y-auto flex-1">
				{#if article}
					<div class="lg:grid lg:grid-cols-12 lg:gap-8">
						<article class="lg:col-span-9">
							<header class="mb-6 border-b border-gray-100 pb-6">
								<div class="flex justify-between items-start mb-4">
									<div class="flex flex-wrap gap-2">
										{#each article.tags as tag}
											<span
												class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
											>
												{tag.name}
											</span>
										{/each}
									</div>
									<span
										class="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider {getStatusColor(
											article.status
										)}"
									>
										{article.status}
									</span>
								</div>

								<h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
									{article.title}
								</h1>
								<div class="flex items-center text-sm text-gray-500 space-x-4">
									<span>
										Last updated: {new Date(article.updatedAt).toLocaleDateString()}
									</span>
									{#if article.author}
										<span>
											Author: {article.author.email}
										</span>
									{/if}
								</div>
							</header>

							<div
								class="preview-content prose prose-blue max-w-none hover:prose-a:text-blue-600 prose-img:rounded-lg prose-headings:scroll-mt-24"
							>
								{@html contentHtml}
							</div>
						</article>

						<aside class="hidden lg:block lg:col-span-3 space-y-6">
							{#if toc.length > 0}
								<div class="bg-gray-50 rounded-lg p-4 sticky top-0">
									<h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
										Table of Contents
									</h3>
									<nav class="space-y-1">
										{#each toc as item}
											<a
												href="#{item.id}"
												class="block text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded transition-all duration-200 truncate"
												style="padding-left: {(item.level - 2) * 1 +
													0.5}rem; border-left: 2px solid transparent;"
												on:click|preventDefault={() => {
													const el = document.getElementById(item.id);
													if (el) el.scrollIntoView({ behavior: 'smooth' });
												}}
											>
												{item.text}
											</a>
										{/each}
									</nav>
								</div>
							{/if}
						</aside>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
				<a
					href="/admin/editor?id={article.id}"
					class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
				>
					Edit Article
				</a>
				<button
					type="button"
					class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
					on:click={close}
				>
					Close
				</button>
			</div>
		</div>
	</div>
</div>
