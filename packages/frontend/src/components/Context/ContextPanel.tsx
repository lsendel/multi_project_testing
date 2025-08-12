import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PanelRightIcon,
  XIcon,
  PinIcon,
  EyeIcon,
  EyeOffIcon,
  BrainIcon,
  BarChart3Icon,
  SettingsIcon,
  PlusIcon,
  TrashIcon,
  CopyIcon,
} from 'lucide-react';
import { useContextStore } from '../../stores/contextStore';
import { useTreeStore } from '../../stores/treeStore';
import AIAssistant from '../AI/AIAssistant';

export default function ContextPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const {
    currentSession,
    sessions,
    suggestions,
    analytics,
    settings,
    activeTab,
    getIncludedNodes,
    getPinnedNodes,
    getExcludedNodes,
    getContextSummary,
    includeNode,
    excludeNode,
    pinNode,
    unpinNode,
    removeFromContext,
    createSession,
    loadSession,
    saveSession,
    deleteSession,
    duplicateSession,
    applySuggestion,
    dismissSuggestion,
    setActiveTab,
    optimizeContext,
    clearContext,
  } = useContextStore();

  const { nodes } = useTreeStore();
  
  const includedNodes = getIncludedNodes();
  const pinnedNodes = getPinnedNodes();
  const excludedNodes = getExcludedNodes();
  const contextSummary = getContextSummary();

  const getNodeById = (id: string) => nodes.get(id);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'included':
        return (
          <div className="space-y-2">
            {Array.from(includedNodes).map((nodeId) => {
              const node = getNodeById(nodeId);
              if (!node) return null;
              
              const isPinned = pinnedNodes.has(nodeId);
              
              return (
                <motion.div
                  key={nodeId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${
                      node.type === 'folder' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {node.name}
                    </span>
                    {isPinned && (
                      <PinIcon className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => isPinned ? unpinNode(nodeId) : pinNode(nodeId)}
                      className={`p-1 rounded ${
                        isPinned
                          ? 'text-amber-600 hover:text-amber-700'
                          : 'text-gray-400 hover:text-amber-500'
                      } transition-colors`}
                      title={isPinned ? 'Unpin' : 'Pin'}
                    >
                      <PinIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => excludeNode(nodeId)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      title="Exclude"
                    >
                      <EyeOffIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromContext(nodeId)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Remove"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {includedNodes.size === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <EyeIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No documents included</p>
                <p className="text-xs mt-1">Select documents from the tree to include them</p>
              </div>
            )}
          </div>
        );

      case 'pinned':
        return (
          <div className="space-y-2">
            {Array.from(pinnedNodes).map((nodeId) => {
              const node = getNodeById(nodeId);
              if (!node) return null;
              
              return (
                <motion.div
                  key={nodeId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <PinIcon className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    <div className={`w-2 h-2 rounded-full ${
                      node.type === 'folder' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {node.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => unpinNode(nodeId)}
                      className="p-1 text-amber-600 hover:text-amber-700 transition-colors"
                      title="Unpin"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {pinnedNodes.size === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <PinIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pinned documents</p>
                <p className="text-xs mt-1">Pin important documents to always include them</p>
              </div>
            )}
          </div>
        );

      case 'excluded':
        return (
          <div className="space-y-2">
            {Array.from(excludedNodes).map((nodeId) => {
              const node = getNodeById(nodeId);
              if (!node) return null;
              
              return (
                <motion.div
                  key={nodeId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <EyeOffIcon className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <div className={`w-2 h-2 rounded-full ${
                      node.type === 'folder' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {node.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => includeNode(nodeId)}
                      className="p-1 text-green-400 hover:text-green-600 transition-colors"
                      title="Include"
                    >
                      <EyeIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromContext(nodeId)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Remove"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {excludedNodes.size === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <EyeOffIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No excluded documents</p>
                <p className="text-xs mt-1">Exclude documents to never include them in context</p>
              </div>
            )}
          </div>
        );

      case 'suggestions':
        return (
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => {
              const node = getNodeById(suggestion.nodeId);
              if (!node) return null;
              
              return (
                <motion.div
                  key={`${suggestion.nodeId}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        node.type === 'folder' ? 'bg-blue-500' : 'bg-purple-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {node.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {suggestion.reason}
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${suggestion.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => applySuggestion(index)}
                      className="p-1 text-green-500 hover:text-green-600 transition-colors"
                      title="Apply"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => dismissSuggestion(index)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Dismiss"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
            {suggestions.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BrainIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No suggestions available</p>
                <p className="text-xs mt-1">AI suggestions will appear here</p>
              </div>
            )}
          </div>
        );

      case 'ai':
        const selectedDocuments = Array.from(includedNodes)
          .map(nodeId => getNodeById(nodeId))
          .filter(node => node !== undefined);
        
        return (
          <div className="space-y-4">
            <AIAssistant selectedDocuments={selectedDocuments} />
          </div>
        );

      default:
        return null;
    }
  };

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 320 }}
        animate={{ width: 48 }}
        className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col"
      >
        <div className="p-3">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <PanelRightIcon className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 48 }}
      animate={{ width: 320 }}
      className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Context Manager
          </h3>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Context Summary */}
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Documents:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {contextSummary.totalNodes}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Pinned:</span>
              <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">
                {contextSummary.pinnedNodes}
              </span>
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {contextSummary.tokenUsage.current.toLocaleString()} / {contextSummary.tokenUsage.limit.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    contextSummary.tokenUsage.current > contextSummary.tokenUsage.limit
                      ? 'bg-red-500'
                      : contextSummary.tokenUsage.current > contextSummary.tokenUsage.limit * 0.8
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (contextSummary.tokenUsage.current / contextSummary.tokenUsage.limit) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'included', label: 'Included', count: includedNodes.size },
          { key: 'pinned', label: 'Pinned', count: pinnedNodes.size },
          { key: 'excluded', label: 'Excluded', count: excludedNodes.size },
          { key: 'suggestions', label: 'Suggestions', count: suggestions.length },
          { key: 'ai', label: 'AI', count: null },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {label}
            {count !== null && count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-full">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={optimizeContext}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Optimize
          </button>
          <button
            onClick={clearContext}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Clear All
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => saveSession()}
            className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Session
          </button>
          <button
            onClick={() => {
              const name = prompt('Session name:', 'New Session');
              if (name) createSession(name);
            }}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="New Session"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}