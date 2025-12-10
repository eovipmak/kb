<script lang="ts">
	import client from '$lib/api/client';
	import { onMount } from 'svelte';

	let apiStatus = $state('Checking...');

	onMount(async () => {
		try {
			await client.get('/health'); // Assuming /health exists, or just check connection
			apiStatus = 'Connected';
		} catch (e) {
			apiStatus = 'Error connecting to API';
		}
	});
</script>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold text-blue-600 mb-4">Knowledge Base Client</h1>
	<p class="mb-4">Welcome to the Knowledge Base.</p>

	<div class="p-4 bg-gray-100 rounded shadow">
		<h2 class="font-semibold">System Status</h2>
		<p>
			API: <span class={apiStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}
				>{apiStatus}</span
			>
		</p>
	</div>
</div>
