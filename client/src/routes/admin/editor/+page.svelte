<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import client from '$lib/api/client';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import CodeBlock from '@tiptap/extension-code-block';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';
	import TaskList from '@tiptap/extension-task-list';
	import TaskItem from '@tiptap/extension-task-item';
	import Underline from '@tiptap/extension-underline';
	import Strike from '@tiptap/extension-strike';
	import TextAlign from '@tiptap/extension-text-align';
	import Color from '@tiptap/extension-color';
	import { TextStyle } from '@tiptap/extension-text-style';
	import Highlight from '@tiptap/extension-highlight';
	import { Table } from '@tiptap/extension-table';
	import { TableRow } from '@tiptap/extension-table-row';
	import { TableCell } from '@tiptap/extension-table-cell';
	import { TableHeader } from '@tiptap/extension-table-header';
	import BubbleMenu from '@tiptap/extension-bubble-menu';
	import { Commands } from './commands.svelte';
    import { ImageUploadExtension } from '$lib/tiptap/ImageUploadExtension';
	import Spinner from '$lib/components/Spinner.svelte';
	import { marked } from 'marked';

	import { page } from '$app/stores';

	let element: HTMLElement;
	let bubbleMenuElement: HTMLElement;
	let editor: Editor;

	let articleId = $page.url.searchParams.get('id');
	let title = '';
	let type = 'FAQ';
	let category = '';
	let categories: any[] = [];
	let tags: string[] = [];
	let tagInput = '';
	let loading = true;
	let saving = false;

	const uploadImage = async (file: File) => {
		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await client.post('/upload', formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			if (res.data.url) {
				editor.chain().focus().setImage({ src: res.data.url }).run();
			}
		} catch (e) {
			alert('Upload failed');
			console.error(e);
		}
	};

	const handleImageUpload = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/png, image/jpeg';
		input.onchange = async () => {
			if (input.files?.length) {
				await uploadImage(input.files[0]);
			}
		};
		input.click();
	};

	onMount(async () => {
		const token = localStorage.getItem('token');
		if (!token) {
			goto('/login');
			return;
		}

		// Initialize editor first
		editor = new Editor({
			element: element,
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3, 4, 5, 6]
					},
					codeBlock: false,
					strike: false
				}),
				CodeBlock,
				Image,
				Link.configure({ openOnClick: false }),
				Placeholder.configure({
					placeholder: 'Write something or type "/"...'
				}),
				TaskList,
				TaskItem.configure({
					nested: true
				}),
				Underline,
				Strike,
				TextAlign.configure({
					types: ['heading', 'paragraph']
				}),
				TextStyle,
				Color,
				Highlight.configure({
					multicolor: true
				}),
				Table.configure({
					resizable: true
				}),
				TableRow,
				TableHeader,
				TableCell,
				Commands(handleImageUpload),
                ImageUploadExtension,
				BubbleMenu.configure({
					element: bubbleMenuElement
				})
			],
			content: '<p></p>',
			editorProps: {
				attributes: {
					class:
						'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] text-gray-300'
				}
			}
		});

		try {
			const catRes = await client.get('/categories');
			categories = catRes.data;

			if (articleId) {
				const artRes = await client.get(`/qa/${articleId}`);
				const art = artRes.data;
				title = art.title;
				type = art.type;
				category = art.categoryId;
				tags = art.tags.map((t: any) => t.name);

				// Convert Markdown to HTML for TipTap if it looks like markdown
				let content = art.contentHtml || '';
				if (content.includes('#') || content.includes('*') || content.includes('- ')) {
					content = await marked.parse(content);
				}
				editor.commands.setContent(content);
			} else if (categories.length > 0) {
				category = categories[0].id;
			}
		} catch (e) {
			console.error('Failed to load data', e);
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		if (editor) editor.destroy();
	});

	const save = async (status: string) => {
		if (!title) return alert('Title is required');

		saving = true;
		try {
			const payload = {
				title,
				type,
				categoryId: category,
				tags,
				contentHtml: editor.getHTML(),
				status
			};

			if (articleId) {
				await client.put(`/qa/${articleId}`, payload);
			} else {
				await client.post('/qa', payload);
			}
			
			alert(`Saved as ${status}`);
			goto('/admin');
		} catch (e) {
			console.error(e);
			alert('Failed to save');
		} finally {
			saving = false;
		}
	};

	// Toolbar Actions
	const setLink = () => {
		const previousUrl = editor.getAttributes('link').href;
		const url = window.prompt('URL', previousUrl);
		if (url === null) return;
		if (url === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	};
</script>

<div
	class="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500 selection:text-white"
>
	<nav class="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
			<h1
				class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400"
			>
				Editor
			</h1>
			<div class="flex gap-3">
				<button
					on:click={() => goto('/admin')}
					class="px-4 py-2 hover:text-white text-gray-400 transition">Cancel</button
				>
			</div>
		</div>
	</nav>

	<main class="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
		<!-- Sidebar -->
		<div class="lg:col-span-1 space-y-6">
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 shadow-lg">
				<div>
					<label
						for="title"
						class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
						>Title</label
					>
					<input
						id="title"
						bind:value={title}
						placeholder="Article Title"
						class="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
					/>
				</div>

				<div>
					<label
						for="type"
						class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
						>Type</label
					>
					<select
						id="type"
						bind:value={type}
						class="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none"
					>
						<option value="FAQ">FAQ</option>
						<option value="TROUBLESHOOTING">Troubleshooting</option>
					</select>
				</div>

				<div>
					<label
						for="category"
						class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
						>Category</label
					>
					<select
						id="category"
						bind:value={category}
						class="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none"
					>
						{#each categories as cat}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label
						for="tags"
						class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
						>Tags</label
					>
					<div class="flex flex-wrap gap-2 mb-2">
						{#each tags as tag}
							<span
								class="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs flex items-center gap-1"
							>
								{tag}
								<button
									aria-label="Remove tag {tag}"
									class="hover:text-white"
									on:click={() => (tags = tags.filter((t) => t !== tag))}>&times;</button
								>
							</span>
						{/each}
					</div>
					<input
						id="tags"
						bind:value={tagInput}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								if (tagInput.trim()) {
									tags = [...tags, tagInput.trim()];
									tagInput = '';
								}
							}
						}}
						placeholder="Add tag..."
						class="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none"
					/>
				</div>
			</div>

			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 shadow-lg">
				<button
					on:click={() => save('DRAFT')}
					disabled={saving}
					aria-busy={saving}
					class="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition flex justify-center items-center gap-2"
				>
					{#if saving}
						<Spinner class="h-4 w-4" />
					{/if}
					Save Draft
				</button>
				<button
					on:click={() => save('REVIEW')}
					disabled={saving}
					aria-busy={saving}
					class="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition shadow-blue-900/20 shadow-lg flex justify-center items-center gap-2"
				>
					{#if saving}
						<Spinner class="h-4 w-4" />
					{/if}
					Submit for Review
				</button>
				<button
					on:click={() => save('PUBLISHED')}
					disabled={saving}
					aria-busy={saving}
					class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-emerald-900/20 shadow-lg flex justify-center items-center gap-2"
				>
					{#if saving}
						<Spinner class="h-4 w-4" />
					{/if}
					Publish
				</button>
			</div>
		</div>

		<!-- Editor -->
		<div class="lg:col-span-3 flex flex-col gap-4">
			
			{#if editor}
				<!-- Bubble Menu -->
				<div
					bind:this={bubbleMenuElement}
					class="bubble-menu bg-gray-900 border border-gray-700 rounded-lg p-1 flex gap-1 items-center shadow-xl transform transition-all duration-200"
				>
					<button
						aria-label="Bold"
						on:click={() => editor.chain().focus().toggleBold().run()}
						class="p-1.5 rounded hover:bg-gray-800 {editor.isActive('bold')
							? 'text-blue-400 bg-gray-800'
							: 'text-gray-400'}"><strong>B</strong></button
					>
					<button
						aria-label="Italic"
						on:click={() => editor.chain().focus().toggleItalic().run()}
						class="p-1.5 rounded hover:bg-gray-800 {editor.isActive('italic')
							? 'text-blue-400 bg-gray-800'
							: 'text-gray-400'}"><em>I</em></button
					>
					<button
						aria-label="Underline"
						on:click={() => editor.chain().focus().toggleUnderline().run()}
						class="p-1.5 rounded hover:bg-gray-800 {editor.isActive('underline')
							? 'text-blue-400 bg-gray-800'
							: 'text-gray-400'}"><u>U</u></button
					>
					<button
						aria-label="Strikethrough"
						on:click={() => editor.chain().focus().toggleStrike().run()}
						class="p-1.5 rounded hover:bg-gray-800 {editor.isActive('strike')
							? 'text-blue-400 bg-gray-800'
							: 'text-gray-400'}"><s>S</s></button
					>
					<div class="w-px h-4 bg-gray-700 mx-1"></div>
					<button
						aria-label="Link"
						on:click={setLink}
						class="p-1.5 rounded hover:bg-gray-800 {editor.isActive('link')
							? 'text-blue-400 bg-gray-800'
							: 'text-gray-400'}">🔗</button
					>
                    <button
						aria-label="Code"
						on:click={() => editor.chain().focus().toggleCode().run()}
						class="p-1.5 rounded hover:bg-gray-800 {editor.isActive('code')
							? 'text-blue-400 bg-gray-800'
							: 'text-gray-400'}">&lt;/&gt;</button
					>
				</div>
			{/if}

			<div
				class="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-8 min-h-[600px] shadow-lg relative"
			>
				<div bind:this={element} class="editor-content"></div>
			</div>
		</div>
	</main>
</div>

<style>
	/* Editor Styles */
	:global(.ProseMirror) {
		outline: none;
		color: #e2e8f0;
		font-size: 1.125rem;
		line-height: 1.75;
	}
	:global(.ProseMirror p) {
		margin-bottom: 1.25em;
	}
	:global(.ProseMirror h1) {
		font-size: 2.25em;
		font-weight: 800;
		margin-top: 0;
		margin-bottom: 0.8em;
		line-height: 1.1;
		letter-spacing: -0.025em;
		color: #fff;
	}
	:global(.ProseMirror h2) {
		font-size: 1.5em;
		font-weight: 700;
		margin-top: 1.5em;
		margin-bottom: 0.8em;
		line-height: 1.3;
		color: #f8fafc;
	}
	:global(.ProseMirror h3) {
		font-size: 1.25em;
		font-weight: 600;
		margin-top: 1.25em;
		margin-bottom: 0.6em;
		line-height: 1.4;
		color: #f1f5f9;
	}
	:global(.ProseMirror h4) {
		font-size: 1.125em;
		font-weight: 600;
		margin-top: 1em;
		margin-bottom: 0.5em;
		color: #e2e8f0;
	}
	:global(.ProseMirror h5) {
		font-size: 1em;
		font-weight: 600;
		margin-top: 1em;
		margin-bottom: 0.5em;
		color: #cbd5e1;
	}
	:global(.ProseMirror h6) {
		font-size: 0.875em;
		font-weight: 600;
		margin-top: 1em;
		margin-bottom: 0.5em;
		color: #94a3b8;
		text-transform: uppercase;
	}
	:global(.ProseMirror ul) {
		list-style-type: disc;
		padding-left: 1.625em;
		margin-bottom: 1.25em;
	}
	:global(.ProseMirror ol) {
		list-style-type: decimal;
		padding-left: 1.625em;
		margin-bottom: 1.25em;
	}
	:global(.ProseMirror code) {
		background-color: #1e293b;
		color: #e2e8f0;
		padding: 0.2em 0.4em;
		border-radius: 0.25em;
		font-size: 0.875em;
		font-family: monospace;
	}
	:global(.ProseMirror pre) {
		background-color: #0f172a;
		padding: 1em;
		border-radius: 0.5em;
		overflow-x: auto;
		margin-bottom: 1.25em;
		border: 1px solid #1e293b;
	}
	:global(.ProseMirror pre code) {
		background-color: transparent;
		padding: 0;
		color: inherit;
		font-size: 0.875em;
	}
	:global(.ProseMirror a) {
		color: #60a5fa;
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	:global(.ProseMirror img) {
		max-width: 100%;
		border-radius: 0.5rem;
		border: 1px solid #1e293b;
		margin: 1.5em 0;
	}
	:global(.ProseMirror blockquote) {
		border-left: 4px solid #3b82f6;
		padding-left: 1em;
		color: #94a3b8;
		font-style: italic;
		margin-bottom: 1.25em;
	}
	:global(.ProseMirror hr) {
		border: none;
		border-top: 2px solid #334155;
		margin: 2em 0;
	}

	/* Task lists */
	:global(.ProseMirror ul[data-type='taskList']) {
		list-style: none;
		padding-left: 0;
	}
	:global(.ProseMirror ul[data-type='taskList'] li) {
		display: flex;
		align-items: flex-start;
		margin-bottom: 0.5em;
	}
	:global(.ProseMirror ul[data-type='taskList'] li > label) {
		flex: 0 0 auto;
		margin-right: 0.5em;
		user-select: none;
	}
	:global(.ProseMirror ul[data-type='taskList'] li > div) {
		flex: 1 1 auto;
	}
	:global(.ProseMirror ul[data-type='taskList'] li > div > p) {
		margin: 0;
	}

	:global(.ProseMirror ul[data-type='taskList'] input[type='checkbox']) {
		cursor: pointer;
		width: 1.1em;
		height: 1.1em;
        margin-top: 0.15em; /* Adjusted roughly for line-height 1.75 */
        appearance: auto;
        accent-color: #3b82f6;
        position: relative;
        top: 0.1em; /* Fine tuning */
	}

	/* Strike-through and underline */
	:global(.ProseMirror s) {
		text-decoration: line-through;
        color: #64748b; /* Dim completed tasks */
	}
	:global(.ProseMirror s) {
		text-decoration: line-through;
	}
	:global(.ProseMirror u) {
		text-decoration: underline;
	}

	/* Text alignment */
	:global(.ProseMirror [style*='text-align: left']) {
		text-align: left;
	}
	:global(.ProseMirror [style*='text-align: center']) {
		text-align: center;
	}
	:global(.ProseMirror [style*='text-align: right']) {
		text-align: right;
	}
	:global(.ProseMirror [style*='text-align: justify']) {
		text-align: justify;
	}

	/* Highlight */
	:global(.ProseMirror mark) {
		padding: 0.125em 0.25em;
		border-radius: 0.125em;
	}

	/* Tables */
	:global(.ProseMirror table) {
		border-collapse: collapse;
		table-layout: fixed;
		width: 100%;
		margin: 1em 0;
		overflow: hidden;
		border: 1px solid #334155;
	}
	:global(.ProseMirror table td, .ProseMirror table th) {
		min-width: 1em;
		border: 1px solid #334155;
		padding: 0.5em 0.75em;
		vertical-align: top;
		box-sizing: border-box;
		position: relative;
		background-color: #0f172a;
	}
	:global(.ProseMirror table th) {
		font-weight: 600;
		text-align: left;
		background-color: #1e293b;
		color: #f8fafc;
	}
	:global(.ProseMirror table .selectedCell) {
		background-color: #1e3a5f;
	}
	:global(.ProseMirror table .column-resize-handle) {
		position: absolute;
		right: -2px;
		top: 0;
		bottom: 0;
		width: 4px;
		background-color: #3b82f6;
		pointer-events: none;
	}

	/* Bubble menu */
	:global(.bubble-menu) {
		display: none;
	}
	:global(.bubble-menu.is-active) {
		display: flex;
	}

	/* Placeholder */
	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: #64748b;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
</style>
