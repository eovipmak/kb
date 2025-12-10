<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import client from '$lib/api/client';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import CodeBlock from '@tiptap/extension-code-block';
    import Image from '@tiptap/extension-image';
    import Link from '@tiptap/extension-link';

    let element: HTMLElement;
    let editor: Editor;
    
    let title = '';
    let type = 'FAQ';
    let category = '';
    let categories: any[] = [];
    let tags: string[] = [];
    let tagInput = '';
    let loading = true;
    let saving = false;

    onMount(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            goto('/login');
            return;
        }
        
        try {
            const res = await client.get('/categories');
            categories = res.data;
            if (categories.length > 0) category = categories[0].id;
        } catch (e) {
            console.error('Failed to load categories', e);
        } finally {
            loading = false;
        }

        editor = new Editor({
            element: element,
            extensions: [
                StarterKit,
                CodeBlock,
                Image,
                Link.configure({ openOnClick: false })
            ],
            content: '<p></p>',
            editorProps: {
                attributes: {
                    class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] text-gray-300'
                }
            }
        });
    });

    onDestroy(() => {
        if (editor) editor.destroy();
    });

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png, image/jpeg';
        input.onchange = async () => {
            if (input.files?.length) {
                const file = input.files[0];
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
            }
        };
        input.click();
    };

    const save = async (status: string) => {
        if (!title) return alert('Title is required');
        
        saving = true;
        try {
            await client.post('/qa', {
                title,
                type,
                categoryId: category,
                tags,
                contentMarkdown: editor.getHTML(),
                status
            });
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

<div class="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500 selection:text-white">
    <nav class="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                Editor
            </h1>
            <div class="flex gap-3">
                <button on:click={() => goto('/admin')} class="px-4 py-2 hover:text-white text-gray-400 transition">Cancel</button>
            </div>
        </div>
    </nav>
    
    <main class="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
            <div class="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 shadow-lg">
                <div>
                     <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                     <input bind:value={title} placeholder="Article Title" class="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" />
                </div>
                
                <div>
                     <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                     <select bind:value={type} class="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none">
                         <option value="FAQ">FAQ</option>
                         <option value="TROUBLESHOOTING">Troubleshooting</option>
                     </select>
                </div>
                
                <div>
                     <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                     <select bind:value={category} class="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none">
                         {#each categories as cat}
                             <option value={cat.id}>{cat.name}</option>
                         {/each}
                     </select>
                </div>
                
                <div>
                     <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</label>
                     <div class="flex flex-wrap gap-2 mb-2">
                         {#each tags as tag}
                             <span class="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs flex items-center gap-1">
                                 {tag}
                                 <button class="hover:text-white" on:click={() => tags = tags.filter(t => t !== tag)}>&times;</button>
                             </span>
                         {/each}
                     </div>
                     <input 
                        bind:value={tagInput}
                        on:keydown={(e) => { if(e.key === 'Enter') { e.preventDefault(); if(tagInput.trim()) { tags = [...tags, tagInput.trim()]; tagInput = ''; } }}}
                        placeholder="Add tag..."
                        class="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none" 
                     />
                </div>
            </div>
            
            <div class="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 shadow-lg">
                <button on:click={() => save('DRAFT')} disabled={saving} class="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition">Save Draft</button>
                <button on:click={() => save('REVIEW')} disabled={saving} class="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition shadow-blue-900/20 shadow-lg">Submit for Review</button>
                <button on:click={() => save('PUBLISHED')} disabled={saving} class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-emerald-900/20 shadow-lg">Publish</button>
            </div>
        </div>

        <!-- Editor -->
        <div class="lg:col-span-3 flex flex-col gap-4">
             <!-- Toolbar -->
             {#if editor}
             <div class="bg-gray-900 border border-gray-800 rounded-xl p-2 flex flex-wrap gap-1 items-center shadow-lg sticky top-24 z-40">
                 <button on:click={() => editor.chain().focus().toggleBold().run()} class="p-2 rounded hover:bg-gray-800 {editor.isActive('bold') ? 'text-blue-400 bg-gray-800' : 'text-gray-400'}"><strong>B</strong></button>
                 <button on:click={() => editor.chain().focus().toggleItalic().run()} class="p-2 rounded hover:bg-gray-800 {editor.isActive('italic') ? 'text-blue-400 bg-gray-800' : 'text-gray-400'}"><em>I</em></button>
                 <button on:click={() => editor.chain().focus().toggleCode().run()} class="p-2 rounded hover:bg-gray-800 {editor.isActive('code') ? 'text-blue-400 bg-gray-800' : 'text-gray-400'}">Code</button>
                 <div class="w-px h-6 bg-gray-800 mx-2"></div>
                 <button on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} class="p-2 rounded hover:bg-gray-800 {editor.isActive('heading', { level: 1 }) ? 'text-blue-400 bg-gray-800' : 'text-gray-400'}">H1</button>
                 <button on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} class="p-2 rounded hover:bg-gray-800 {editor.isActive('heading', { level: 2 }) ? 'text-blue-400 bg-gray-800' : 'text-gray-400'}">H2</button>
                 <div class="w-px h-6 bg-gray-800 mx-2"></div>
                 <button on:click={() => editor.chain().focus().toggleBulletList().run()} class="p-2 rounded hover:bg-gray-800 {editor.isActive('bulletList') ? 'text-blue-400 bg-gray-800' : 'text-gray-400'}">List</button>
                 <button on:click={() => editor.chain().focus().toggleCodeBlock().run()} class="p-2 rounded hover:bg-gray-800 {editor.isActive('codeBlock') ? 'text-blue-400 bg-gray-800' : 'text-gray-400'}">CodeBlock</button>
                 <div class="w-px h-6 bg-gray-800 mx-2"></div>
                 <button on:click={setLink} class="p-2 rounded hover:bg-gray-800 {editor.isActive('link') ? 'text-blue-400 bg-gray-800' : 'text-gray-400'}">Link</button>
                 <button on:click={handleImageUpload} class="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-blue-400">Img</button>
             </div>
             {/if}

             <div class="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-8 min-h-[600px] shadow-lg relative">
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
    :global(.ProseMirror p) { margin-bottom: 1.25em; }
    :global(.ProseMirror h1) { font-size: 2.25em; font-weight: 800; margin-top: 0; margin-bottom: 0.8em; line-height: 1.1; letter-spacing: -0.025em; color: #fff; }
    :global(.ProseMirror h2) { font-size: 1.5em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.8em; line-height: 1.3; color: #f8fafc; }
    :global(.ProseMirror ul) { list-style-type: disc; padding-left: 1.625em; margin-bottom: 1.25em; }
    :global(.ProseMirror ol) { list-style-type: decimal; padding-left: 1.625em; margin-bottom: 1.25em; }
    :global(.ProseMirror code) { background-color: #1e293b; color: #e2e8f0; padding: 0.2em 0.4em; border-radius: 0.25em; font-size: 0.875em; font-family: monospace; }
    :global(.ProseMirror pre) { background-color: #0f172a; padding: 1em; border-radius: 0.5em; overflow-x: auto; margin-bottom: 1.25em; border: 1px solid #1e293b; }
    :global(.ProseMirror pre code) { background-color: transparent; padding: 0; color: inherit; font-size: 0.875em; }
    :global(.ProseMirror a) { color: #60a5fa; text-decoration: underline; text-underline-offset: 4px; }
    :global(.ProseMirror img) { max-width: 100%; border-radius: 0.5rem; border: 1px solid #1e293b; margin: 1.5em 0; }
    :global(.ProseMirror blockquote) { border-left: 4px solid #3b82f6; padding-left: 1em; color: #94a3b8; font-style: italic; margin-bottom: 1.25em; }
</style>
