import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DocumentNode } from '@shared/types';

interface TokenUsage {
  current: number;
  limit: number;
  breakdown: {
    pinned: number;
    selected: number;
    conversation: number;
  };
}

interface ContextSession {
  id: string;
  name: string;
  includedNodes: Set<string>;
  pinnedNodes: Set<string>;
  excludedNodes: Set<string>;
  tokenUsage: TokenUsage;
  createdAt: Date;
  updatedAt: Date;
}

interface ContextState {
  // Current session
  currentSession: ContextSession;
  
  // Session management
  sessions: Map<string, ContextSession>;
  
  // Context suggestions
  suggestions: {
    nodeId: string;
    reason: string;
    confidence: number;
  }[];
  
  // Analytics
  analytics: {
    totalDocumentsUsed: number;
    averageContextSize: number;
    mostUsedDocuments: { nodeId: string; usageCount: number }[];
    contextEfficiencyScore: number;
  };
  
  // Settings
  settings: {
    autoIncludeRelated: boolean;
    maxTokenLimit: number;
    contextInclusionDefault: 'manual' | 'auto';
    enableSmartSuggestions: boolean;
  };
  
  // UI state
  isContextPanelOpen: boolean;
  activeTab: 'included' | 'pinned' | 'excluded' | 'suggestions';
}

interface ContextActions {
  // Context management
  includeNode: (nodeId: string) => void;
  excludeNode: (nodeId: string) => void;
  pinNode: (nodeId: string) => void;
  unpinNode: (nodeId: string) => void;
  removeFromContext: (nodeId: string) => void;
  
  // Bulk operations
  includeMultiple: (nodeIds: string[]) => void;
  excludeMultiple: (nodeIds: string[]) => void;
  clearContext: () => void;
  
  // Session management
  createSession: (name: string) => string;
  loadSession: (sessionId: string) => void;
  saveSession: () => void;
  deleteSession: (sessionId: string) => void;
  duplicateSession: (sessionId: string) => string;
  
  // Token management
  calculateTokenUsage: (nodes: DocumentNode[]) => number;
  updateTokenUsage: () => void;
  optimizeContext: () => void;
  
  // Suggestions
  generateSuggestions: (nodes: DocumentNode[]) => void;
  applySuggestion: (index: number) => void;
  dismissSuggestion: (index: number) => void;
  
  // Settings
  updateSettings: (updates: Partial<ContextState['settings']>) => void;
  
  // UI actions
  setContextPanelOpen: (open: boolean) => void;
  setActiveTab: (tab: ContextState['activeTab']) => void;
  
  // Analytics
  updateAnalytics: (nodes: DocumentNode[]) => void;
  
  // Computed getters
  getIncludedNodes: () => Set<string>;
  getPinnedNodes: () => Set<string>;
  getExcludedNodes: () => Set<string>;
  getContextSummary: () => {
    totalNodes: number;
    pinnedNodes: number;
    tokenUsage: TokenUsage;
    efficiency: number;
  };
}

const createDefaultSession = (): ContextSession => ({
  id: crypto.randomUUID(),
  name: 'Default Session',
  includedNodes: new Set(),
  pinnedNodes: new Set(),
  excludedNodes: new Set(),
  tokenUsage: {
    current: 0,
    limit: 8000,
    breakdown: {
      pinned: 0,
      selected: 0,
      conversation: 0,
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useContextStore = create<ContextState & ContextActions>()(
  immer((set, get) => ({
    // Initial state
    currentSession: createDefaultSession(),
    sessions: new Map(),
    suggestions: [],
    analytics: {
      totalDocumentsUsed: 0,
      averageContextSize: 0,
      mostUsedDocuments: [],
      contextEfficiencyScore: 0,
    },
    settings: {
      autoIncludeRelated: false,
      maxTokenLimit: 8000,
      contextInclusionDefault: 'manual',
      enableSmartSuggestions: true,
    },
    isContextPanelOpen: false,
    activeTab: 'included',

    // Context management
    includeNode: (nodeId) =>
      set((state) => {
        state.currentSession.includedNodes.add(nodeId);
        state.currentSession.excludedNodes.delete(nodeId);
        state.currentSession.updatedAt = new Date();
      }),

    excludeNode: (nodeId) =>
      set((state) => {
        state.currentSession.excludedNodes.add(nodeId);
        state.currentSession.includedNodes.delete(nodeId);
        state.currentSession.pinnedNodes.delete(nodeId);
        state.currentSession.updatedAt = new Date();
      }),

    pinNode: (nodeId) =>
      set((state) => {
        state.currentSession.pinnedNodes.add(nodeId);
        state.currentSession.includedNodes.add(nodeId);
        state.currentSession.excludedNodes.delete(nodeId);
        state.currentSession.updatedAt = new Date();
      }),

    unpinNode: (nodeId) =>
      set((state) => {
        state.currentSession.pinnedNodes.delete(nodeId);
        state.currentSession.updatedAt = new Date();
      }),

    removeFromContext: (nodeId) =>
      set((state) => {
        state.currentSession.includedNodes.delete(nodeId);
        state.currentSession.pinnedNodes.delete(nodeId);
        state.currentSession.excludedNodes.delete(nodeId);
        state.currentSession.updatedAt = new Date();
      }),

    // Bulk operations
    includeMultiple: (nodeIds) =>
      set((state) => {
        nodeIds.forEach((nodeId) => {
          state.currentSession.includedNodes.add(nodeId);
          state.currentSession.excludedNodes.delete(nodeId);
        });
        state.currentSession.updatedAt = new Date();
      }),

    excludeMultiple: (nodeIds) =>
      set((state) => {
        nodeIds.forEach((nodeId) => {
          state.currentSession.excludedNodes.add(nodeId);
          state.currentSession.includedNodes.delete(nodeId);
          state.currentSession.pinnedNodes.delete(nodeId);
        });
        state.currentSession.updatedAt = new Date();
      }),

    clearContext: () =>
      set((state) => {
        state.currentSession.includedNodes.clear();
        state.currentSession.pinnedNodes.clear();
        state.currentSession.excludedNodes.clear();
        state.currentSession.updatedAt = new Date();
      }),

    // Session management
    createSession: (name) => {
      const newSession = {
        ...createDefaultSession(),
        name,
      };
      
      set((state) => {
        state.sessions.set(newSession.id, newSession);
      });
      
      return newSession.id;
    },

    loadSession: (sessionId) =>
      set((state) => {
        const session = state.sessions.get(sessionId);
        if (session) {
          state.currentSession = { ...session };
        }
      }),

    saveSession: () =>
      set((state) => {
        state.sessions.set(state.currentSession.id, { ...state.currentSession });
      }),

    deleteSession: (sessionId) =>
      set((state) => {
        state.sessions.delete(sessionId);
        if (state.currentSession.id === sessionId) {
          state.currentSession = createDefaultSession();
        }
      }),

    duplicateSession: (sessionId) => {
      const session = get().sessions.get(sessionId);
      if (!session) return '';
      
      const newSession = {
        ...session,
        id: crypto.randomUUID(),
        name: `${session.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => {
        state.sessions.set(newSession.id, newSession);
      });
      
      return newSession.id;
    },

    // Token management
    calculateTokenUsage: (nodes) => {
      // Rough estimation: ~4 characters per token
      return nodes.reduce((total, node) => {
        const contentLength = (node.content?.preview || '').length;
        return total + Math.ceil(contentLength / 4);
      }, 0);
    },

    updateTokenUsage: () => {
      set((state) => {
        // This would be implemented with actual token calculation
        // For now, using placeholder values
        const pinnedCount = state.currentSession.pinnedNodes.size;
        const includedCount = state.currentSession.includedNodes.size;
        
        state.currentSession.tokenUsage.breakdown.pinned = pinnedCount * 100;
        state.currentSession.tokenUsage.breakdown.selected = includedCount * 50;
        state.currentSession.tokenUsage.current = 
          state.currentSession.tokenUsage.breakdown.pinned +
          state.currentSession.tokenUsage.breakdown.selected +
          state.currentSession.tokenUsage.breakdown.conversation;
      });
    },

    optimizeContext: () => {
      set((state) => {
        // Simple optimization: remove least relevant nodes when over limit
        const { tokenUsage } = state.currentSession;
        if (tokenUsage.current <= tokenUsage.limit) return;
        
        // This is a simplified optimization - in practice would be more sophisticated
        const includedArray = Array.from(state.currentSession.includedNodes);
        const toRemove = Math.ceil(includedArray.length * 0.2); // Remove 20%
        
        for (let i = 0; i < toRemove && includedArray.length > 0; i++) {
          const nodeId = includedArray.pop();
          if (nodeId && !state.currentSession.pinnedNodes.has(nodeId)) {
            state.currentSession.includedNodes.delete(nodeId);
          }
        }
        
        state.currentSession.updatedAt = new Date();
      });
    },

    // Suggestions
    generateSuggestions: (nodes) => {
      const { currentSession, settings } = get();
      if (!settings.enableSmartSuggestions) return;
      
      const suggestions = nodes
        .filter((node) => 
          !currentSession.includedNodes.has(node.id) &&
          !currentSession.excludedNodes.has(node.id)
        )
        .map((node) => ({
          nodeId: node.id,
          reason: `Similar to selected documents (${node.metadata.tags.join(', ')})`,
          confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0 range
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
      
      set((state) => {
        state.suggestions = suggestions;
      });
    },

    applySuggestion: (index) =>
      set((state) => {
        const suggestion = state.suggestions[index];
        if (suggestion) {
          state.currentSession.includedNodes.add(suggestion.nodeId);
          state.suggestions.splice(index, 1);
          state.currentSession.updatedAt = new Date();
        }
      }),

    dismissSuggestion: (index) =>
      set((state) => {
        state.suggestions.splice(index, 1);
      }),

    // Settings
    updateSettings: (updates) =>
      set((state) => {
        Object.assign(state.settings, updates);
      }),

    // UI actions
    setContextPanelOpen: (open) =>
      set((state) => {
        state.isContextPanelOpen = open;
      }),

    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab;
      }),

    // Analytics
    updateAnalytics: (nodes) => {
      const { currentSession } = get();
      
      set((state) => {
        state.analytics.totalDocumentsUsed = currentSession.includedNodes.size;
        state.analytics.averageContextSize = currentSession.tokenUsage.current;
        
        // Calculate efficiency based on token usage vs limit
        state.analytics.contextEfficiencyScore = Math.min(
          1,
          currentSession.tokenUsage.limit / Math.max(1, currentSession.tokenUsage.current)
        );
        
        // Update most used documents (simplified)
        state.analytics.mostUsedDocuments = nodes
          .filter((node) => currentSession.includedNodes.has(node.id))
          .map((node) => ({
            nodeId: node.id,
            usageCount: node.metadata.usageCount,
          }))
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 10);
      });
    },

    // Computed getters
    getIncludedNodes: () => get().currentSession.includedNodes,
    getPinnedNodes: () => get().currentSession.pinnedNodes,
    getExcludedNodes: () => get().currentSession.excludedNodes,

    getContextSummary: () => {
      const { currentSession } = get();
      return {
        totalNodes: currentSession.includedNodes.size,
        pinnedNodes: currentSession.pinnedNodes.size,
        tokenUsage: currentSession.tokenUsage,
        efficiency: get().analytics.contextEfficiencyScore,
      };
    },
  }))
);