<script lang="ts">
	interface Props {
		items: any[];
		command: (item: any) => void;
	}

	let { items = [], command } = $props<Props>();

	let selectedIndex = $state(0);

	export function updateProps(newItems: any[]) {
		// In Svelte 5, if items comes from props, we can't reassign it if it's not a local state.
		// But here we just want to reset the selection when items change.
		selectedIndex = 0;
	}

	// We can use $effect to reset selectedIndex when items change if needed,
	// but usually the caller will call updateProps or the reactive nature of $props will handle it.
	$effect(() => {
		if (items) {
			selectedIndex = 0;
		}
	});

	export const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
		if (event.key === 'ArrowUp') {
			upHandler();
			return true;
		}

		if (event.key === 'ArrowDown') {
			downHandler();
			return true;
		}

		if (event.key === 'Enter') {
			enterHandler();
			return true;
		}

		return false;
	};

	const upHandler = () => {
		selectedIndex = (selectedIndex + items.length - 1) % items.length;
	};

	const downHandler = () => {
		selectedIndex = (selectedIndex + 1) % items.length;
	};

	const enterHandler = () => {
		selectItem(selectedIndex);
	};

	const selectItem = (index: number) => {
		const item = items[index];
		if (item) {
			command(item);
		}
	};
</script>

<div
	class="bg-[#1e1e1e] border border-gray-800 rounded-md shadow-2xl overflow-hidden min-w-[280px] p-1 flex flex-col"
>
	{#if items.length}
		{#each items as item, index}
			<button
				class="w-full text-left px-2 py-1.5 text-sm rounded-md flex items-center gap-3 transition-colors
				{index === selectedIndex ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-white/5'}"
				on:click={() => selectItem(index)}
				on:mouseenter={() => (selectedIndex = index)}
			>
				{#if item.icon}
					<div
						class="flex items-center justify-center w-5 h-5 rounded {index === selectedIndex
							? 'text-white'
							: 'text-gray-400'}"
					>
						{#if typeof item.icon === 'string'}
							<span class="font-medium text-xs font-mono">{item.icon}</span>
						{:else}
							<!-- Fallback if we eventually use components for icons -->
							{item.icon}
						{/if}
					</div>
				{/if}
				<div class="flex flex-col gap-0.5">
					<span class="font-medium leading-none">{item.title}</span>
					{#if item.description}
						<span class="text-xs {index === selectedIndex ? 'text-blue-100' : 'text-gray-500'}"
							>{item.description}</span
						>
					{/if}
				</div>
			</button>
		{/each}
	{:else}
		<div class="px-3 py-2 text-sm text-gray-500">No result</div>
	{/if}
</div>
