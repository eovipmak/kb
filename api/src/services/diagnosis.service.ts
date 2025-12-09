import { DiagnosisFlow } from '@prisma/client';
import { prisma } from '../utils/db';

// Node and Edge Interfaces
export interface DiagnosisNode {
    id: string;
    type: 'question' | 'solution';
    content: string;
    qaPageId?: string; // For solution type
}

export interface DiagnosisEdge {
    from: string;
    to: string;
    label: string;
}

export interface CreateDiagnosisFlowDTO {
    title: string;
    description?: string;
    startNodeId: string;
    nodes: DiagnosisNode[];
    edges: DiagnosisEdge[];
}

export class DiagnosisService {
    /**
     * Validate Flow Logic
     */
    static validateFlow(nodes: DiagnosisNode[], edges: DiagnosisEdge[], startNodeId: string) {
        const nodeIds = new Set(nodes.map(n => n.id));

        // 1. Check all edges point to existing nodes
        for (const edge of edges) {
            if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
                throw new Error(`Edge references missing node: ${edge.from} -> ${edge.to}`);
            }
        }

        // 2. Check startNode exists
        if (!nodeIds.has(startNodeId)) {
            throw new Error('Start node does not exist');
        }

        // 3. Check at least one solution node
        const hasSolution = nodes.some(n => n.type === 'solution');
        if (!hasSolution) {
            throw new Error('Flow must have at least one solution node');
        }

        // 4. Check for circular references (Simple DFS/BFS or just cycle detection)
        // A diagnosis flow is a DAG (Directed Acyclic Graph)?
        // User said "Ensure no circular references".
        if (this.detectCycle(nodes, edges)) {
            throw new Error('Circular reference detected');
        }
    }

    private static detectCycle(nodes: DiagnosisNode[], edges: DiagnosisEdge[]): boolean {
        const adj = new Map<string, string[]>();
        nodes.forEach(n => adj.set(n.id, []));
        edges.forEach(e => adj.get(e.from)?.push(e.to));

        const visited = new Set<string>();
        const recStack = new Set<string>();

        const dfs = (nodeId: string): boolean => {
            visited.add(nodeId);
            recStack.add(nodeId);

            const neighbors = adj.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (dfs(neighbor)) return true;
                } else if (recStack.has(neighbor)) {
                    return true;
                }
            }

            recStack.delete(nodeId);
            return false;
        };

        for (const node of nodes) {
            if (!visited.has(node.id)) {
                if (dfs(node.id)) return true;
            }
        }

        return false;
    }

    static async createFlow(data: CreateDiagnosisFlowDTO) {
        this.validateFlow(data.nodes, data.edges, data.startNodeId);

        return prisma.diagnosisFlow.create({
            data: {
                title: data.title,
                description: data.description,
                startNodeId: data.startNodeId,
                nodes: JSON.stringify(data.nodes),
                edges: JSON.stringify(data.edges)
            }
        });
    }

    static async getFlow(id: string) {
        const flow = await prisma.diagnosisFlow.findUnique({
            where: { id }
        });
        if (!flow) return null;
        return {
            ...flow,
            nodes: JSON.parse(flow.nodes),
            edges: JSON.parse(flow.edges)
        };
    }

    static async updateFlow(id: string, data: Partial<CreateDiagnosisFlowDTO>) {
        // If updating structure, need specific logic to merge or replace.
        // Spec assumes full update or specific fields. Let's assume full structure validation if nodes/edges changed.

        // Fetch existing to merge if partial, but typically PUT is full replacement or we validate the new set.
        // If partial update, we might need to fetch current state.
        // Simpler: assume data contains all nodes/edges if they are being updated.

        let updateData: any = { ...data };

        if (data.nodes || data.edges || data.startNodeId) {
            // Need to validate carefully.
            // If partial, strictly we should fetch existing.
            // Let's fetch existing for validation.
            const existing = await this.getFlow(id);
            if (!existing) throw new Error('Not found');

            const newNodes = data.nodes || existing.nodes as any as DiagnosisNode[];
            const newEdges = data.edges || existing.edges as any as DiagnosisEdge[];
            const newStart = data.startNodeId || existing.startNodeId;

            this.validateFlow(newNodes, newEdges, newStart);

            if (data.nodes) updateData.nodes = JSON.stringify(data.nodes);
            if (data.edges) updateData.edges = JSON.stringify(data.edges);
        }

        return prisma.diagnosisFlow.update({
            where: { id },
            data: updateData
        });
    }

    static async getTraversal(id: string, nodeId: string) {
        const flow = await this.getFlow(id);
        if (!flow) throw new Error('Flow not found');

        const nodes = flow.nodes as any as DiagnosisNode[];
        const edges = flow.edges as any as DiagnosisEdge[];

        const currentNode = nodes.find(n => n.id === nodeId);
        if (!currentNode) throw new Error('Node not found');

        const outgoingEdges = edges.filter(e => e.from === nodeId);

        const options = outgoingEdges.map(e => ({
            label: e.label,
            nextNodeId: e.to
        }));

        // If solution, maybe fetch linked article?
        let solution = null;
        if (currentNode.type === 'solution' && currentNode.qaPageId) {
            const qaPage = await prisma.qAPage.findUnique({
                where: { id: currentNode.qaPageId },
                select: { id: true, title: true, slug: true }
            });
            solution = qaPage;
        }

        return {
            currentNode,
            options,
            solution
        };
    }
}
