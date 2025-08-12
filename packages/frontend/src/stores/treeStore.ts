import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DocumentNode } from '@shared/types';

interface TreeState {
  // Core tree data
  nodes: Map<string, DocumentNode>;
  rootNodes: string[];
  
  // UI state
  expandedNodes: Set<string>;
  selectedNodes: Set<string>;
  focusedNode: string | null;
  
  // View state
  viewMode: 'tree' | 'grid' | 'list';
  sortBy: 'name' | 'date' | 'relevance' | 'size';
  searchQuery: string;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

interface TreeActions {
  // Data actions
  setNodes: (nodes: DocumentNode[]) => void;
  addNode: (node: DocumentNode) => void;
  updateNode: (id: string, updates: Partial<DocumentNode>) => void;
  removeNode: (id: string) => void;
  
  // Selection actions
  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  clearSelection: () => void;
  selectMultiple: (ids: string[]) => void;
  
  // Expansion actions
  expandNode: (id: string) => void;
  collapseNode: (id: string) => void;
  toggleExpansion: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  expandToLevel: (level: number) => void;
  
  // Focus actions
  setFocusedNode: (id: string | null) => void;
  
  // View actions
  setViewMode: (mode: 'tree' | 'grid' | 'list') => void;
  setSortBy: (sort: 'name' | 'date' | 'relevance' | 'size') => void;
  setSearchQuery: (query: string) => void;
  
  // Computed getters
  getSelectedNodes: () => DocumentNode[];
  getExpandedNodes: () => DocumentNode[];
  getChildNodes: (parentId: string) => DocumentNode[];
  getNodePath: (nodeId: string) => DocumentNode[];
  getFilteredNodes: () => DocumentNode[];
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTreeStore = create<TreeState & TreeActions>()(
  immer((set, get) => ({
    // Initial state
    nodes: new Map(),
    rootNodes: [],
    expandedNodes: new Set(),
    selectedNodes: new Set(),
    focusedNode: null,
    viewMode: 'tree',
    sortBy: 'name',
    searchQuery: '',
    isLoading: false,
    error: null,

    // Data actions
    setNodes: (nodes) =>
      set((state) => {
        state.nodes.clear();
        state.rootNodes = [];
        
        nodes.forEach((node) => {
          state.nodes.set(node.id, node);
          if (!node.parentId) {
            state.rootNodes.push(node.id);
          }
        });
      }),

    addNode: (node) =>
      set((state) => {
        state.nodes.set(node.id, node);
        if (!node.parentId) {
          state.rootNodes.push(node.id);
        }
      }),

    updateNode: (id, updates) =>
      set((state) => {
        const node = state.nodes.get(id);
        if (node) {
          Object.assign(node, updates);
        }
      }),

    removeNode: (id) =>
      set((state) => {
        state.nodes.delete(id);
        state.rootNodes = state.rootNodes.filter((nodeId) => nodeId !== id);
        state.expandedNodes.delete(id);
        state.selectedNodes.delete(id);
        if (state.focusedNode === id) {
          state.focusedNode = null;
        }
      }),

    // Selection actions
    selectNode: (id, multi = false) =>
      set((state) => {
        if (!multi) {
          state.selectedNodes.clear();
        }
        state.selectedNodes.add(id);
      }),

    deselectNode: (id) =>
      set((state) => {
        state.selectedNodes.delete(id);
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedNodes.clear();
      }),

    selectMultiple: (ids) =>
      set((state) => {
        ids.forEach((id) => state.selectedNodes.add(id));
      }),

    // Expansion actions
    expandNode: (id) =>
      set((state) => {
        state.expandedNodes.add(id);
      }),

    collapseNode: (id) =>
      set((state) => {
        state.expandedNodes.delete(id);
      }),

    toggleExpansion: (id) =>
      set((state) => {
        if (state.expandedNodes.has(id)) {
          state.expandedNodes.delete(id);
        } else {
          state.expandedNodes.add(id);
        }
      }),

    expandAll: () =>
      set((state) => {
        state.nodes.forEach((node) => {
          if (node.type === 'folder') {
            state.expandedNodes.add(node.id);
          }
        });
      }),

    collapseAll: () =>
      set((state) => {
        state.expandedNodes.clear();
      }),

    expandToLevel: (level) =>
      set((state) => {
        const expandToLevelRecursive = (nodeIds: string[], currentLevel: number) => {
          if (currentLevel >= level) return;
          
          nodeIds.forEach((nodeId) => {
            const node = state.nodes.get(nodeId);
            if (node && node.type === 'folder') {
              state.expandedNodes.add(nodeId);
              
              if (node.children) {
                expandToLevelRecursive(
                  node.children.map((child) => child.id),
                  currentLevel + 1
                );
              }
            }
          });
        };
        
        state.expandedNodes.clear();
        expandToLevelRecursive(state.rootNodes, 0);
      }),

    // Focus actions
    setFocusedNode: (id) =>
      set((state) => {
        state.focusedNode = id;
      }),

    // View actions
    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode;
      }),

    setSortBy: (sort) =>
      set((state) => {
        state.sortBy = sort;
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query;
      }),

    // Computed getters
    getSelectedNodes: () => {
      const { nodes, selectedNodes } = get();
      return Array.from(selectedNodes)
        .map((id) => nodes.get(id))
        .filter(Boolean) as DocumentNode[];
    },

    getExpandedNodes: () => {
      const { nodes, expandedNodes } = get();
      return Array.from(expandedNodes)
        .map((id) => nodes.get(id))
        .filter(Boolean) as DocumentNode[];
    },

    getChildNodes: (parentId) => {
      const { nodes } = get();
      const parentNode = nodes.get(parentId);
      return parentNode?.children || [];
    },

    getNodePath: (nodeId) => {
      const { nodes } = get();
      const path: DocumentNode[] = [];
      let current = nodes.get(nodeId);
      
      while (current) {
        path.unshift(current);
        current = current.parentId ? nodes.get(current.parentId) : null;
      }
      
      return path;
    },

    getFilteredNodes: () => {
      const { nodes, searchQuery, sortBy } = get();
      let filteredNodes = Array.from(nodes.values());
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredNodes = filteredNodes.filter(
          (node) =>
            node.name.toLowerCase().includes(query) ||
            node.metadata.tags.some((tag) =>
              tag.toLowerCase().includes(query)
            ) ||
            (node.content?.preview?.toLowerCase().includes(query))
        );
      }
      
      // Apply sorting
      filteredNodes.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'date':
            return new Date(b.metadata.lastModified).getTime() - new Date(a.metadata.lastModified).getTime();
          case 'relevance':
            return (b.metadata.relevanceScore || 0) - (a.metadata.relevanceScore || 0);
          case 'size':
            return b.metadata.size - a.metadata.size;
          default:
            return 0;
        }
      });
      
      return filteredNodes;
    },

    // Loading states
    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),
  }))
);