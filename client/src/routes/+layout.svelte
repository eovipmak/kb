<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded shadow-lg font-medium outline-none ring-2 ring-white"
>
	Skip to content
</a>

<div id="main-content">
	{@render children()}
</div>
