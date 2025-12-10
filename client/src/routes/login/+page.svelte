<script lang="ts">
    import { goto } from '$app/navigation';
    import client from '$lib/api/client';

    let email = '';
    let password = '';
    let error = '';
    let loading = false;

    async function login() {
        loading = true;
        error = '';
        try {
            const res = await client.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            // Decode token or fetch user info if needed to check role, 
            // for now assume success means access granted.
            goto('/admin');
        } catch (e: any) {
            console.error(e);
            error = e.response?.data?.message || 'Login failed';
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                Sign in to Admin Dashboard
            </h2>
        </div>
        <form class="mt-8 space-y-6" on:submit|preventDefault={login}>
            <div class="rounded-md shadow-sm -space-y-px">
                <div>
                    <label for="email-address" class="sr-only">Email address</label>
                    <input id="email-address" name="email" type="email" autocomplete="email" required 
                        bind:value={email}
                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                        placeholder="Email address">
                </div>
                <div>
                    <label for="password" class="sr-only">Password</label>
                    <input id="password" name="password" type="password" autocomplete="current-password" required 
                        bind:value={password}
                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                        placeholder="Password">
                </div>
            </div>

            {#if error}
                <div class="text-red-500 text-sm text-center">{error}</div>
            {/if}

            <div>
                <button type="submit" disabled={loading}
                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    {#if loading}
                        Running...
                    {:else}
                        Sign in
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>
