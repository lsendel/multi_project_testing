import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon,
  SparklesIcon,
  ZapIcon,
  BrainIcon,
  ClockIcon,
  TrendingUpIcon,
  XIcon,
  ArrowRightIcon,
  LoaderIcon
} from 'lucide-react';
import type { DocumentNode } from '@shared/types';

interface SearchSuggestion {
  type: 'semantic' | 'related' | 'concept' | 'autocomplete';
  text: string;
  description?: string;
  confidence: number;
  relatedDocs?: string[];
}

interface SmartSearchProps {
  onSearch: (query: string, type?: 'semantic' | 'keyword') => void;
  onSelectDocument: (docId: string) => void;
  recentSearches?: string[];
  isLoading?: boolean;
}

export default function SmartSearch({ 
  onSearch, 
  onSelectDocument, 
  recentSearches = [],
  isLoading = false 
}: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic'>('keyword');
  const [smartQueries, setSmartQueries] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Generate smart search suggestions
  useEffect(() => {
    if (query.length > 2) {
      generateSuggestions(query);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  // Initialize with smart query suggestions
  useEffect(() => {
    generateSmartQueries();
  }, []);

  const generateSmartQueries = async () => {
    // Simulate AI-generated smart queries based on document corpus
    const mockSmartQueries = [
      "Find documents about design patterns and architecture",
      "Show me implementation examples for databases",
      "Documents discussing best practices",
      "API design and development guides",
      "Performance optimization techniques"
    ];
    setSmartQueries(mockSmartQueries);
  };

  const generateSuggestions = async (searchQuery: string) => {
    setIsGeneratingSuggestions(true);
    
    try {
      // Simulate AI-powered suggestion generation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockSuggestions: SearchSuggestion[] = [
        {
          type: 'semantic',
          text: `"${searchQuery}" (semantic search)`,
          description: 'Find conceptually related content',
          confidence: 0.92,
          relatedDocs: ['doc1', 'doc2']
        },
        {
          type: 'concept',
          text: `Concepts related to "${searchQuery}"`,
          description: 'Explore broader topic areas',
          confidence: 0.87
        },
        {
          type: 'related',
          text: `Similar to "${searchQuery}"`,
          description: 'Documents with similar themes',
          confidence: 0.84
        }
      ];
      
      // Add autocomplete suggestions
      if (searchQuery.length > 0) {
        const autocompleteSuggestions = [
          `${searchQuery} implementation`,
          `${searchQuery} best practices`,
          `${searchQuery} examples`,
          `${searchQuery} patterns`
        ].map(text => ({
          type: 'autocomplete' as const,
          text,
          confidence: 0.7
        }));
        
        mockSuggestions.push(...autocompleteSuggestions);
      }
      
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleSearch = (searchQuery?: string, type?: 'semantic' | 'keyword') => {
    const finalQuery = searchQuery || query;
    const finalType = type || searchMode;
    
    if (finalQuery.trim()) {
      onSearch(finalQuery, finalType);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const searchType = suggestion.type === 'semantic' ? 'semantic' : 'keyword';
    setQuery(suggestion.text);
    handleSearch(suggestion.text, searchType);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'semantic': return BrainIcon;
      case 'concept': return SparklesIcon;
      case 'related': return TrendingUpIcon;
      case 'autocomplete': return SearchIcon;
      default: return SearchIcon;
    }
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'semantic': return 'text-purple-500';
      case 'concept': return 'text-blue-500';
      case 'related': return 'text-green-500';
      case 'autocomplete': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="relative">
      {/* Search Mode Toggle */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setSearchMode('keyword')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            searchMode === 'keyword'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <SearchIcon className="w-4 h-4" />
          <span>Keyword</span>
        </button>
        <button
          onClick={() => setSearchMode('semantic')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            searchMode === 'semantic'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <BrainIcon className="w-4 h-4" />
          <span>Semantic</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length > 2 && setShowSuggestions(true)}
            placeholder={
              searchMode === 'semantic' 
                ? "Ask a natural language question..." 
                : "Search documents..."
            }
            className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {isLoading || isGeneratingSuggestions ? (
              <LoaderIcon className="w-5 h-5 text-gray-400 animate-spin" />
            ) : searchMode === 'semantic' ? (
              <BrainIcon className="w-5 h-5 text-purple-500" />
            ) : (
              <SearchIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* AI-Powered Search Mode Indicator */}
        {searchMode === 'semantic' && (
          <div className="absolute -bottom-6 left-0 flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
            <SparklesIcon className="w-3 h-3" />
            <span>AI-powered semantic search</span>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              {suggestions.map((suggestion, index) => {
                const IconComponent = getSuggestionIcon(suggestion.type);
                const iconColor = getSuggestionColor(suggestion.type);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                  >
                    <IconComponent className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {suggestion.text}
                      </p>
                      {suggestion.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {suggestion.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {suggestion.confidence && (
                        <span className="text-xs text-gray-500">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      )}
                      <ArrowRightIcon className="w-3 h-3 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Query Suggestions */}
      {!query && smartQueries.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <ZapIcon className="w-4 h-4 text-yellow-500" />
            <span>Smart Queries</span>
          </h4>
          <div className="space-y-2">
            {smartQueries.slice(0, 3).map((smartQuery, index) => (
              <button
                key={index}
                onClick={() => handleSearch(smartQuery, 'semantic')}
                className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {smartQuery}
                  </span>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span>Recent Searches</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 5).map((search, index) => (
              <button
                key={index}
                onClick={() => handleSearch(search)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}