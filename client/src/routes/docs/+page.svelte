<script lang="ts">
    import { onMount } from 'svelte';
    import { api } from '$lib/api';
    import { fade } from 'svelte/transition';

    let articles: any[] = [];
    let loading = true;
    let error = '';

    onMount(async () => {
        try {
            // Fetch only PUBLISHED articles
            articles = await api.listQA({ status: 'PUBLISHED' });
        } catch (e: any) {
            console.error(e);
            error = 'Failed to load articles.';
        } finally {
            loading = false;
        }
    });

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
</script>

<svelte:head>
    <title>Knowledge Base | Docs</title>
    <meta name="description" content="Browse all knowledge base articles, tutorials, and guides." />
</svelte:head>

<div class="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-inter">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
            <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
                Knowledge Base
            </h1>
            <p class="text-xl text-slate-600 max-w-2xl mx-auto">
                Explore our collection of guides, tutorials, and troubleshooting articles.
            </p>
            <div class="mt-8">
                <a href="/search" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                    <svg class="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search all articles
                </a>
            </div>
        </div>

        {#if loading}
            <div class="flex justify-center py-20">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        {:else if error}
            <div class="text-center py-20">
                <div class="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-slate-900">Error loading content</h3>
                <p class="mt-2 text-slate-500">{error}</p>
            </div>
        {:else if articles.length === 0}
            <div class="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 class="mt-4 text-lg font-medium text-slate-900">No articles found</h3>
                <p class="mt-2 text-slate-500">Check back later for new content.</p>
            </div>
        {:else}
            <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3" in:fade>
                {#each articles as article}
                    <a href="/docs/{article.slug}" class="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-1">
                        <div class="p-6 flex-1 flex flex-col">
                            <div class="flex items-center justify-between mb-4">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 uppercase tracking-wide">
                                    {article.type}
                                </span>
                                <span class="text-xs text-slate-500">
                                    {formatDate(article.createdAt)}
                                </span>
                            </div>
                            
                            <h3 class="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3 line-clamp-2">
                                {article.title}
                            </h3>
                            
                            <div class="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                                <div class="flex items-center space-x-2">
                                    {#if article.category}
                                        <span class="text-sm text-slate-500 font-medium">
                                            {article.category.name}
                                        </span>
                                    {/if}
                                </div>
                                <span class="text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform flex items-center">
                                    Read 
                                    <svg class="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    /* Ensure font availability if not global, but usually inherited */
    :global(body) {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
</style>
