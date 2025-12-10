<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { page } from '$app/stores';
    import { fade, fly } from 'svelte/transition';
    import client from '$lib/api/client';
    import { goto } from '$app/navigation';

    let flowId = $page.params.flowId;
    
    interface Node {
        id: string;
        type: 'question' | 'solution';
        content: string;
        qaPageId?: string;
    }

    interface Option {
        label: string;
        nextNodeId: string;
    }

    interface Solution {
        id: string;
        title: string;
        slug: string;
    }

    interface TraversalResponse {
        currentNode: Node;
        options: Option[];
        solution?: Solution | null;
    }

    let flowTitle = 'Loading...';
    let startNodeId = '';
    
    let loading = true;
    let loadingNode = false;
    let error = '';

    // State
    let currentNode: Node | null = null;
    let currentOptions: Option[] = [];
    let currentSolution: Solution | null = null;
    
    // History for "Back" functionality
    // We store the full state of previous steps to restore instantly
    interface HistoryStep {
        node: Node;
        options: Option[];
        solution: Solution | null;
    }
    let history: HistoryStep[] = [];

    onMount(async () => {
        try {
            await loadFlow();
        } catch (e: any) {
            error = e.response?.data?.message || e.message;
            loading = false;
        }
    });

    async function loadFlow() {
        // Fetch flow metadata
        const res = await client.get(`/diagnosis-flows/${flowId}`);
        const flow = res.data;
        flowTitle = flow.title;
        startNodeId = flow.startNodeId;
        
        // Load first node
        await loadNode(startNodeId);
        loading = false;
    }

    async function loadNode(nodeId: string) {
        loadingNode = true;
        try {
            const res = await client.get(`/diagnosis-flows/${flowId}/node/${nodeId}`);
            const data: TraversalResponse = res.data;
            
            currentNode = data.currentNode;
            currentOptions = data.options;
            currentSolution = data.solution || null;
        } catch (e: any) {
            error = e.response?.data?.message || 'Failed to load question';
        } finally {
            loadingNode = false;
        }
    }

    function handleOptionClick(option: Option) {
        if (!currentNode) return;
        
        // Push current state to history
        history = [...history, {
            node: currentNode,
            options: currentOptions,
            solution: currentSolution
        }];

        loadNode(option.nextNodeId);
    }

    function handleBack() {
        if (history.length === 0) return;
        
        const previous = history[history.length - 1];
        history = history.slice(0, -1);
        
        // Restore state
        currentNode = previous.node;
        currentOptions = previous.options;
        currentSolution = previous.solution;
    }

    function handleRestart() {
        history = [];
        loadNode(startNodeId);
    }
</script>

<div class="troubleshoot-container">
    <div class="breadcrumb">
        <a href="/">Home</a> &rsaquo; <span>Troubleshoot</span> &rsaquo; <span>{flowTitle}</span>
    </div>

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading troubleshooting flow...</p>
        </div>
    {:else if error}
        <div class="error-state">
            <p>Error: {error}</p>
            <button on:click={() => location.reload()}>Retry</button>
        </div>
    {:else if currentNode}
        <div class="flow-content" in:fade={{ duration: 300 }}>
            <!-- Progress / History Indicator -->
            <div class="progress-bar">
                Step {history.length + 1}
            </div>

            <div class="card">
                <div class="card-header">
                    {#if currentNode.type === 'question'}
                        <div class="icon-wrapper question-icon">?</div>
                        <h2>Question</h2>
                    {:else}
                        <div class="icon-wrapper solution-icon">✓</div>
                        <h2>Solution Found</h2>
                    {/if}
                </div>

                <div class="card-body">
                    <p class="node-content">{currentNode.content}</p>

                    {#if currentNode.type === 'solution' && currentSolution}
                        <div class="solution-link">
                            <p>We found an article that might help:</p>
                            <a href="/docs/{currentSolution.slug}" class="article-card">
                                <h3>{currentSolution.title}</h3>
                                <span>Read Article &rarr;</span>
                            </a>
                        </div>
                    {/if}
                </div>

                <div class="card-actions">
                    {#if currentNode.type === 'question'}
                        <div class="options-grid">
                            {#each currentOptions as option}
                                <button 
                                    class="option-btn" 
                                    on:click={() => handleOptionClick(option)}
                                    disabled={loadingNode}
                                >
                                    {option.label}
                                </button>
                            {/each}
                        </div>
                    {:else}
                        <div class="solution-actions">
                            <a href="/docs/{currentSolution?.slug}" class="btn-primary">Read Full Guide</a>
                            <button class="btn-secondary" on:click={handleRestart}>Start Over</button>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="navigation-controls">
                <button 
                    class="back-btn" 
                    on:click={handleBack} 
                    disabled={history.length === 0 || loadingNode}
                >
                    &larr; Back
                </button>
                {#if history.length > 0}
                    <button class="restart-link" on:click={handleRestart}>Restart</button>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    /* Design Aesthetics & Colors */
    :root {
        --primary-color: #3b82f6; 
        --primary-hover: #2563eb;
        --bg-color: #f8fafc;
        --card-bg: #ffffff;
        --text-main: #1e293b;
        --text-sub: #64748b;
        --border-color: #e2e8f0;
        --success-color: #10b981;
    }

    .troubleshoot-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
        font-family: 'Inter', system-ui, sans-serif;
        color: var(--text-main);
    }

    .breadcrumb {
        font-size: 0.9rem;
        color: var(--text-sub);
        margin-bottom: 2rem;
    }
    
    .breadcrumb a {
        color: var(--primary-color);
        text-decoration: none;
    }

    .breadcrumb a:hover {
        text-decoration: underline;
    }

    /* Loading / Error */
    .loading-state, .error-state {
        text-align: center;
        padding: 4rem;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--border-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Card Design */
    .card {
        background: var(--card-bg);
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        margin-bottom: 2rem;
        border: 1px solid rgba(255,255,255,0.5);
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .card-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: bold;
        color: white;
    }

    .question-icon {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
    }

    .solution-icon {
        background: linear-gradient(135deg, #10b981, #059669);
    }

    .node-content {
        font-size: 1.25rem;
        line-height: 1.6;
        margin-bottom: 2rem;
        color: #334155;
    }

    /* Options */
    .options-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .option-btn {
        background: #fff;
        border: 2px solid var(--border-color);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--text-main);
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
    }

    .option-btn:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
        background: #eff6ff;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    /* Solution Link */
    .solution-link {
        margin-top: 2rem;
        padding: 1.5rem;
        background: #f0fdf4;
        border-radius: 12px;
        border: 1px solid #bbf7d0;
    }

    .article-card {
        display: block;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s;
        margin-top: 1rem;
    }

    .article-card:hover {
        transform: translateX(4px);
        border-color: var(--success-color);
    }

    .article-card h3 {
        margin: 0;
        color: var(--text-main);
    }

    .article-card span {
        font-size: 0.9rem;
        color: var(--success-color);
        font-weight: 600;
    }

    .solution-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
    }

    .btn-primary {
        background: var(--primary-color);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        display: inline-block;
    }

    .btn-secondary {
        background: transparent;
        border: 2px solid var(--border-color);
        color: var(--text-sub);
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
    }

    /* Navigation */
    .navigation-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2rem;
    }

    .back-btn {
        background: none;
        border: none;
        color: var(--text-sub);
        cursor: pointer;
        font-size: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 8px;
    }

    .back-btn:hover:not(:disabled) {
        background: rgba(0,0,0,0.05);
        color: var(--text-main);
    }

    .back-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .restart-link {
        background: none;
        border: none;
        color: var(--text-sub);
        cursor: pointer;
        text-decoration: underline;
    }

    .progress-bar {
        margin-bottom: 1rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-sub);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>
