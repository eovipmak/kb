<script lang="ts">
    import { onMount } from 'svelte';
    import client from '$lib/api/client';

    let flows: any[] = [];
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        try {
            const res = await client.get('/diagnosis-flows');
            flows = res.data;
        } catch (e) {
            console.error('Failed to load flows', e);
            error = 'Could not load troubleshooting guides.';
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

<div class="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
            <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-5xl">
                Troubleshooting Center
            </h1>
            <p class="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                Select a guide to start diagnosing your issue step-by-step.
            </p>
        </div>

        {#if loading}
            <div class="flex justify-center my-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        {:else if error}
            <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-8">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                </div>
            </div>
        {:else if flows.length === 0}
            <div class="text-center py-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No guides found</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Check back later for new troubleshooting guides.</p>
            </div>
        {:else}
            <div class="grid gap-6 md:grid-cols-2">
                {#each flows as flow}
                    <a href="/troubleshoot/{flow.id}" class="block group relative bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300 p-6">
                        <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {flow.title}
                        </h3>
                        {#if flow.description}
                            <p class="mt-2 text-gray-600 dark:text-gray-400 line-clamp-2">
                                {flow.description}
                            </p>
                        {/if}
                        <div class="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-500">
                            <span class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                Created {formatDate(flow.createdAt)}
                            </span>
                        </div>
                        <div class="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                            Start Guide
                            <svg class="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
