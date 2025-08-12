import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  ClockIcon,
  TagIcon,
  FileTextIcon,
  FolderIcon,
  StarIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { SearchQuery, SearchResult, DocumentNode } from '@shared/types';
import { searchDocuments } from '../../services/api';

interface SearchInterfaceProps {
  onNodeSelect?: (node: DocumentNode) => void;
  onAddToContext?: (nodes: DocumentNode[]) => void;
}

export default function SearchInterface({ onNodeSelect, onAddToContext }: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchQuery['filters']>({});
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'date' | 'size'>('relevance');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search query
  const searchQuery: SearchQuery = {
    query: debouncedQuery,
    filters,
    sort: { field: sortBy, order: 'desc' },
    pagination: { page: 1, limit: 50 },
  };

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchDocuments(searchQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 30000, // 30 seconds
  });

  // Recent searches (stored in localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch {
      return [];
    }
  });

  const addToRecentSearches = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = () => {
    if (query.trim()) {
      addToRecentSearches(query);
      refetch();
    }
  };

  const handleNodeClick = (node: DocumentNode) => {
    onNodeSelect?.(node);
  };

  const handleAddToContext = (nodes: DocumentNode[]) => {
    onAddToContext?.(nodes);
    setSelectedResults(new Set());
  };

  const toggleResultSelection = (nodeId: string) => {
    const newSelection = new Set(selectedResults);
    if (newSelection.has(nodeId)) {
      newSelection.delete(nodeId);
    } else {
      newSelection.add(nodeId);
    }
    setSelectedResults(newSelection);
  };

  const selectAllResults = () => {
    if (!searchResults?.nodes) return;
    const allIds = new Set(searchResults.nodes.map(node => node.id));
    setSelectedResults(allIds);
  };

  const clearSelection = () => {
    setSelectedResults(new Set());
  };

  const selectedNodes = useMemo(() => {
    if (!searchResults?.nodes) return [];
    return searchResults.nodes.filter(node => selectedResults.has(node.id));
  }, [searchResults, selectedResults]);

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Search Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents, content, tags..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`px-4 py-3 rounded-xl transition-colors ${
                isAdvancedOpen || Object.keys(filters).some(key => filters[key as keyof typeof filters])
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Advanced Filters"
            >
              <FilterIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Search
            </button>
          </div>

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Searches</span>
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-1">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="w-full text-left px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Type
                  </label>
                  <select
                    value={filters?.documentType?.[0] || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      documentType: e.target.value ? [e.target.value] : undefined
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Types</option>
                    <option value="document">Documents</option>
                    <option value="folder">Folders</option>
                    <option value="pdf">PDF</option>
                    <option value="image">Images</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tags..."
                    value={filters?.tags?.join(', ') || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="name">Name</option>
                    <option value="date">Date Modified</option>
                    <option value="size">Size</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {Object.keys(filters).filter(key => filters[key as keyof typeof filters]).length} filter(s) applied
                </div>
                <button
                  onClick={() => setFilters({})}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-red-600 dark:text-red-400">
            <p>Error searching documents. Please try again.</p>
          </div>
        )}

        {searchResults && (
          <div className="p-6">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {searchResults.totalCount} results found in {searchResults.searchTime}ms
              </div>
              
              {searchResults.nodes.length > 0 && (
                <div className="flex items-center space-x-2">
                  {selectedResults.size > 0 && (
                    <>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedResults.size} selected
                      </span>
                      <button
                        onClick={() => handleAddToContext(selectedNodes)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Add to Context
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Clear
                      </button>
                    </>
                  )}
                  <button
                    onClick={selectAllResults}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    Select All
                  </button>
                </div>
              )}
            </div>

            {/* Search Results List */}
            <div className="space-y-3">
              <AnimatePresence>
                {searchResults.nodes.map((node, index) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                      selectedResults.has(node.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800'
                    }`}
                    onClick={() => handleNodeClick(node)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Selection checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedResults.has(node.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleResultSelection(node.id);
                        }}
                        className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />

                      {/* Node icon */}
                      <div className="flex-shrink-0 mt-1">
                        {node.type === 'folder' ? (
                          <FolderIcon className="w-5 h-5 text-blue-500" />
                        ) : (
                          <FileTextIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </div>

                      {/* Node content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                          {highlightText(node.name, debouncedQuery)}
                        </h3>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {node.path}
                        </p>

                        {node.content?.preview && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                            {highlightText(node.content.preview, debouncedQuery)}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>{new Date(node.metadata.lastModified).toLocaleDateString()}</span>
                            <span>{(node.metadata.size / 1024).toFixed(1)} KB</span>
                            {node.metadata.relevanceScore && (
                              <div className="flex items-center space-x-1">
                                <TrendingUpIcon className="w-3 h-3" />
                                <span>{Math.round(node.metadata.relevanceScore * 100)}%</span>
                              </div>
                            )}
                          </div>

                          {node.metadata.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <TagIcon className="w-3 h-3 text-gray-400" />
                              <div className="flex space-x-1">
                                {node.metadata.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {node.metadata.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{node.metadata.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* No Results */}
            {searchResults.totalCount === 0 && debouncedQuery && (
              <div className="text-center py-12">
                <SearchIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search terms or filters
                </p>
                <button
                  onClick={() => {
                    setQuery('');
                    setFilters({});
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!query && !searchResults && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <SearchIcon className="w-16 h-16 text-gray-400 mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Search your knowledge base
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              Find documents, folders, and content across your entire knowledge tree. Use filters to narrow down results.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <h4 className="font-medium mb-2">Search Tips:</h4>
                <ul className="space-y-1">
                  <li>• Use quotes for exact phrases</li>
                  <li>• Search by content or filename</li>
                  <li>• Filter by type or tags</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Examples:</h4>
                <ul className="space-y-1">
                  <li>• "project documentation"</li>
                  <li>• tag:important</li>
                  <li>• type:pdf meeting</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}