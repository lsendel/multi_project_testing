import SearchInterface from '../components/Search/SearchInterface';
import SmartSearch from '../components/AI/SmartSearch';
import { useTreeStore } from '../stores/treeStore';
import { useContextStore } from '../stores/contextStore';
import { useState } from 'react';
import type { DocumentNode } from '@shared/types';

export default function SearchPage() {
  const [searchMode, setSearchMode] = useState<'traditional' | 'ai'>('traditional');
  const [isSearching, setIsSearching] = useState(false);
  
  const { selectNode, setFocusedNode } = useTreeStore();
  const { includeMultiple } = useContextStore();

  const handleNodeSelect = (node: DocumentNode) => {
    selectNode(node.id);
    setFocusedNode(node.id);
  };

  const handleAddToContext = (nodes: DocumentNode[]) => {
    const nodeIds = nodes.map(node => node.id);
    includeMultiple(nodeIds);
  };

  const handleSearch = async (query: string, type?: 'semantic' | 'keyword') => {
    setIsSearching(true);
    try {
      // This would normally call search API with the query and type
      console.log('Searching for:', query, 'Type:', type);
      
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDocument = (docId: string) => {
    setFocusedNode(docId);
    selectNode(docId);
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className="h-full flex flex-col">
        {/* Search Mode Toggle */}
        <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Document Search
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSearchMode('traditional')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  searchMode === 'traditional'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Traditional Search
              </button>
              <button
                onClick={() => setSearchMode('ai')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  searchMode === 'ai'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                AI-Powered Search
              </button>
            </div>
          </div>

          {/* Search Interface */}
          {searchMode === 'ai' ? (
            <SmartSearch
              onSearch={handleSearch}
              onSelectDocument={handleSelectDocument}
              recentSearches={['design patterns', 'API architecture', 'database optimization']}
              isLoading={isSearching}
            />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Traditional search interface will be displayed here. This integrates with the existing SearchInterface component.
              </p>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-hidden">
          {searchMode === 'traditional' ? (
            <SearchInterface
              onNodeSelect={handleNodeSelect}
              onAddToContext={handleAddToContext}
            />
          ) : (
            <div className="h-full p-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full">
                <div className="p-6 text-center">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      AI Search Results
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Search results will be displayed here with AI-powered semantic matching, 
                      relevance scoring, and intelligent document suggestions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}