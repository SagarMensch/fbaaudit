// Location Hierarchy Management Service
// Multi-level hierarchies, parent-child relationships, inheritance

export interface HierarchyNode {
    id: string;
    name: string;
    code: string;
    type: 'COUNTRY' | 'REGION' | 'STATE' | 'CITY' | 'ZONE' | 'CLUSTER';
    parentId?: string;
    level: number;
    path: string[]; // Array of ancestor IDs from root to this node
    children: HierarchyNode[];
    metadata: {
        locationCount: number;
        totalVolume?: number;
        coverage?: string;
        manager?: string;
    };
    inherited: {
        // Properties inherited from parent
        serviceLevels?: string[];
        operatingHours?: string;
        restrictions?: string[];
    };
}

export interface HierarchyStatistics {
    totalNodes: number;
    byLevel: Record<number, number>;
    byType: Record<string, number>;
    maxDepth: number;
    orphanedNodes: number;
}

class LocationHierarchyService {
    private STORAGE_KEY = 'location_hierarchy_v1';
    private nodes: Map<string, HierarchyNode> = new Map();

    constructor() {
        this.load();
    }

    private load() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            this.nodes = new Map(Object.entries(data));
        } else {
            // Initialize with India hierarchy
            this.initializeIndiaHierarchy();
        }
    }

    private save() {
        const data = Object.fromEntries(this.nodes);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    private initializeIndiaHierarchy() {
        // Root: India
        const india: HierarchyNode = {
            id: 'IND',
            name: 'India',
            code: 'IND',
            type: 'COUNTRY',
            level: 0,
            path: [],
            children: [],
            metadata: { locationCount: 0 },
            inherited: {}
        };
        this.nodes.set('IND', india);

        // Regions
        const regions = [
            { id: 'NORTH', name: 'North India', states: ['Delhi', 'Haryana', 'Punjab', 'Uttar Pradesh'] },
            { id: 'SOUTH', name: 'South India', states: ['Karnataka', 'Tamil Nadu', 'Kerala', 'Telangana'] },
            { id: 'WEST', name: 'West India', states: ['Maharashtra', 'Gujarat', 'Rajasthan'] },
            { id: 'EAST', name: 'East India', states: ['West Bengal', 'Bihar', 'Odisha'] }
        ];

        regions.forEach(region => {
            const regionNode: HierarchyNode = {
                id: region.id,
                name: region.name,
                code: region.id,
                type: 'REGION',
                parentId: 'IND',
                level: 1,
                path: ['IND'],
                children: [],
                metadata: { locationCount: 0 },
                inherited: {}
            };
            this.nodes.set(region.id, regionNode);
            india.children.push(regionNode);

            // Add states
            region.states.forEach(stateName => {
                const stateId = `${region.id}-${stateName.replace(/\s+/g, '')}`;
                const stateNode: HierarchyNode = {
                    id: stateId,
                    name: stateName,
                    code: stateName.substring(0, 3).toUpperCase(),
                    type: 'STATE',
                    parentId: region.id,
                    level: 2,
                    path: ['IND', region.id],
                    children: [],
                    metadata: { locationCount: 0 },
                    inherited: {}
                };
                this.nodes.set(stateId, stateNode);
                regionNode.children.push(stateNode);
            });
        });

        this.save();
    }

    /**
     * Create a new hierarchy node
     */
    public createNode(node: Omit<HierarchyNode, 'level' | 'path' | 'children'>): HierarchyNode {
        const parent = node.parentId ? this.nodes.get(node.parentId) : null;

        const newNode: HierarchyNode = {
            ...node,
            level: parent ? parent.level + 1 : 0,
            path: parent ? [...parent.path, parent.id] : [],
            children: []
        };

        this.nodes.set(node.id, newNode);

        // Add to parent's children
        if (parent) {
            parent.children.push(newNode);
        }

        this.save();
        return newNode;
    }

    /**
     * Get node by ID
     */
    public getNode(id: string): HierarchyNode | undefined {
        return this.nodes.get(id);
    }

    /**
     * Get all nodes at a specific level
     */
    public getNodesByLevel(level: number): HierarchyNode[] {
        return Array.from(this.nodes.values()).filter(n => n.level === level);
    }

    /**
     * Get all nodes of a specific type
     */
    public getNodesByType(type: HierarchyNode['type']): HierarchyNode[] {
        return Array.from(this.nodes.values()).filter(n => n.type === type);
    }

    /**
     * Get children of a node
     */
    public getChildren(nodeId: string): HierarchyNode[] {
        const node = this.nodes.get(nodeId);
        return node ? node.children : [];
    }

    /**
     * Get all descendants of a node (recursive)
     */
    public getDescendants(nodeId: string): HierarchyNode[] {
        const node = this.nodes.get(nodeId);
        if (!node) return [];

        const descendants: HierarchyNode[] = [];
        const traverse = (n: HierarchyNode) => {
            n.children.forEach(child => {
                descendants.push(child);
                traverse(child);
            });
        };

        traverse(node);
        return descendants;
    }

    /**
     * Get ancestors of a node
     */
    public getAncestors(nodeId: string): HierarchyNode[] {
        const node = this.nodes.get(nodeId);
        if (!node) return [];

        return node.path.map(id => this.nodes.get(id)!).filter(Boolean);
    }

    /**
     * Get root nodes (nodes without parents)
     */
    public getRootNodes(): HierarchyNode[] {
        return Array.from(this.nodes.values()).filter(n => !n.parentId);
    }

    /**
     * Get full hierarchy tree
     */
    public getHierarchyTree(): HierarchyNode[] {
        return this.getRootNodes();
    }

    /**
     * Move node to a new parent
     */
    public moveNode(nodeId: string, newParentId: string): boolean {
        const node = this.nodes.get(nodeId);
        const newParent = this.nodes.get(newParentId);

        if (!node || !newParent) return false;

        // Check for circular reference
        if (this.wouldCreateCircularReference(nodeId, newParentId)) {
            return false;
        }

        // Remove from old parent
        if (node.parentId) {
            const oldParent = this.nodes.get(node.parentId);
            if (oldParent) {
                oldParent.children = oldParent.children.filter(c => c.id !== nodeId);
            }
        }

        // Update node
        node.parentId = newParentId;
        node.level = newParent.level + 1;
        node.path = [...newParent.path, newParent.id];

        // Add to new parent
        newParent.children.push(node);

        // Update all descendants
        this.updateDescendantPaths(node);

        this.save();
        return true;
    }

    private wouldCreateCircularReference(nodeId: string, newParentId: string): boolean {
        const descendants = this.getDescendants(nodeId);
        return descendants.some(d => d.id === newParentId);
    }

    private updateDescendantPaths(node: HierarchyNode) {
        node.children.forEach(child => {
            child.level = node.level + 1;
            child.path = [...node.path, node.id];
            this.updateDescendantPaths(child);
        });
    }

    /**
     * Delete a node (and optionally its children)
     */
    public deleteNode(nodeId: string, deleteChildren: boolean = false): boolean {
        const node = this.nodes.get(nodeId);
        if (!node) return false;

        if (deleteChildren) {
            // Delete all descendants
            const descendants = this.getDescendants(nodeId);
            descendants.forEach(d => this.nodes.delete(d.id));
        } else {
            // Move children to parent
            if (node.parentId) {
                const parent = this.nodes.get(node.parentId);
                if (parent) {
                    node.children.forEach(child => {
                        child.parentId = node.parentId;
                        child.level = node.level;
                        child.path = node.path;
                        parent.children.push(child);
                    });
                }
            }
        }

        // Remove from parent's children
        if (node.parentId) {
            const parent = this.nodes.get(node.parentId);
            if (parent) {
                parent.children = parent.children.filter(c => c.id !== nodeId);
            }
        }

        this.nodes.delete(nodeId);
        this.save();
        return true;
    }

    /**
     * Update node metadata
     */
    public updateNode(nodeId: string, updates: Partial<HierarchyNode>): boolean {
        const node = this.nodes.get(nodeId);
        if (!node) return false;

        Object.assign(node, updates);
        this.save();
        return true;
    }

    /**
     * Get hierarchy statistics
     */
    public getStatistics(): HierarchyStatistics {
        const nodes = Array.from(this.nodes.values());

        const byLevel: Record<number, number> = {};
        const byType: Record<string, number> = {};
        let maxDepth = 0;

        nodes.forEach(node => {
            byLevel[node.level] = (byLevel[node.level] || 0) + 1;
            byType[node.type] = (byType[node.type] || 0) + 1;
            maxDepth = Math.max(maxDepth, node.level);
        });

        const orphanedNodes = nodes.filter(n => n.parentId && !this.nodes.has(n.parentId)).length;

        return {
            totalNodes: nodes.length,
            byLevel,
            byType,
            maxDepth,
            orphanedNodes
        };
    }

    /**
     * Search nodes by name or code
     */
    public search(query: string): HierarchyNode[] {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.nodes.values()).filter(n =>
            n.name.toLowerCase().includes(lowerQuery) ||
            n.code.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Get breadcrumb path for a node
     */
    public getBreadcrumb(nodeId: string): string[] {
        const node = this.nodes.get(nodeId);
        if (!node) return [];

        const ancestors = this.getAncestors(nodeId);
        return [...ancestors.map(a => a.name), node.name];
    }

    /**
     * Validate hierarchy integrity
     */
    public validateIntegrity(): Array<{ nodeId: string; issue: string }> {
        const issues: Array<{ nodeId: string; issue: string }> = [];

        this.nodes.forEach((node, id) => {
            // Check parent exists
            if (node.parentId && !this.nodes.has(node.parentId)) {
                issues.push({ nodeId: id, issue: 'Parent node does not exist' });
            }

            // Check path integrity
            if (node.path.some(ancestorId => !this.nodes.has(ancestorId))) {
                issues.push({ nodeId: id, issue: 'Path contains non-existent ancestor' });
            }

            // Check level consistency
            if (node.parentId) {
                const parent = this.nodes.get(node.parentId);
                if (parent && node.level !== parent.level + 1) {
                    issues.push({ nodeId: id, issue: 'Level inconsistent with parent' });
                }
            }
        });

        return issues;
    }

    /**
     * Export hierarchy as JSON
     */
    public exportHierarchy(): string {
        const tree = this.getHierarchyTree();
        return JSON.stringify(tree, null, 2);
    }

    /**
     * Get hierarchy depth for a specific branch
     */
    public getBranchDepth(nodeId: string): number {
        const descendants = this.getDescendants(nodeId);
        if (descendants.length === 0) return 0;

        return Math.max(...descendants.map(d => d.level)) - (this.nodes.get(nodeId)?.level || 0);
    }
}

export const locationHierarchyService = new LocationHierarchyService();
