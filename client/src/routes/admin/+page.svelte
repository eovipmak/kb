<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import client from '$lib/api/client';

    let stats = {
        articles: 0,
        users: 0,
        views: 0
    };
    let loading = true;

    onMount(async () => {
        // Quick check if auth token exists
        const token = localStorage.getItem('token');
        if (!token) {
            goto('/login'); // Assuming login route exists, otherwise maybe home
            return;
        }

        try {
            // Fetch some stats if available, or just mocking for now to ensure page loads
            // const res = await client.get('/analytics/stats'); 
            // stats = res.data;
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    });
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
    <div class="max-w-7xl mx-auto space-y-8">
        <header class="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
                <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Admin Dashboard</h1>
                <p class="text-gray-500 dark:text-gray-400 mt-1">Manage your knowledge base and users</p>
            </div>
            <div class="flex gap-4">
                <a href="/admin/editor" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-lg shadow-blue-500/20">
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
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Articles</h3>
                    <p class="text-3xl font-bold mt-2">--</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Users</h3>
                    <p class="text-3xl font-bold mt-2">--</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Views</h3>
                    <p class="text-3xl font-bold mt-2">--</p>
                </div>
            </div>

            <!-- Quick Links -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h2 class="text-xl font-bold">Quick Actions</h2>
                    </div>
                    <div class="p-6 grid gap-4">
                        <a href="/admin/editor" class="block p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group">
                            <span class="font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">Create New Article</span>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Write a new FAQ or Troubleshooting guide</p>
                        </a>
                        <!-- Add more links as features are implemented -->
                        <div class="block p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 opacity-60 cursor-not-allowed">
                            <span class="font-semibold">Manage Users</span>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Coming soon...</p>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
