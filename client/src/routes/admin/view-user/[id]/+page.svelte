<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
	<div class="max-w-3xl mx-auto">
		<a
			href="/admin"
			class="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6"
		>
			<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"
				><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
				></path></svg
			>
			Back to Dashboard
		</a>

		<div
			class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8"
		>
			<h1 class="text-2xl font-bold mb-4">User Details</h1>
			<div
				class="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg"
			>
				<p><strong>Note:</strong> User management is currently under development.</p>
				<p class="mt-2 text-sm">
					Viewing details for User ID: <code
						class="bg-yellow-100 dark:bg-yellow-900/40 px-1 py-0.5 rounded">{page.params.id}</code
					>
				</p>
			</div>

			<div class="mt-8 space-y-4 animate-pulse">
				<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
				<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
				<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
			</div>
		</div>
	</div>
</div>
