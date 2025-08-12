import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExpandIcon,
  MinimizeIcon,
  SearchIcon,
  FilterIcon,
  SettingsIcon,
  TreeIcon,
  GridIcon,
  ListIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { useTreeStore } from '../../stores/treeStore';

interface TreeControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRefresh: () => void;
}

export default function TreeControls({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRefresh,
}: TreeControlsProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const {
    viewMode,
    sortBy,
    searchQuery,
    expandedNodes,
    selectedNodes,
    setViewMode,
    setSortBy,
    setSearchQuery,
    expandAll,
    collapseAll,
    expandToLevel,
    clearSelection,
  } = useTreeStore();

  const handleExpandLevel = (level: number) => {
    expandToLevel(level);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Left side - Main controls */}
      <div className="flex items-center space-x-2">
        {/* View mode selector */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { mode: 'tree' as const, icon: TreeIcon, label: 'Tree View' },
            { mode: 'grid' as const, icon: GridIcon, label: 'Grid View' },
            { mode: 'list' as const, icon: ListIcon, label: 'List View' },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 rounded-md transition-colors duration-200 ${
                viewMode === mode
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Expansion controls */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => handleExpandLevel(1)}
            className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            title="Expand to Level 1"
          >
            L1
          </button>
          <button
            onClick={() => handleExpandLevel(2)}
            className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            title="Expand to Level 2"
          >
            L2
          </button>
          <button
            onClick={() => handleExpandLevel(3)}
            className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            title="Expand to Level 3"
          >
            L3
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button
            onClick={expandAll}
            className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            title="Expand All"
          >
            <ExpandIcon className="w-4 h-4" />
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            title="Collapse All"
          >
            <MinimizeIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={onZoomOut}
            className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            title="Zoom Out"
          >
            <ZoomOutIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onResetZoom}
            className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            title="Reset Zoom"
          >
            100%
          </button>
          <button
            onClick={onZoomIn}
            className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            title="Zoom In"
          >
            <ZoomInIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <motion.div
            initial={{ width: isSearchOpen ? 300 : 40 }}
            animate={{ width: isSearchOpen ? 300 : 40 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {isSearchOpen ? (
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onBlur={() => !searchQuery && setIsSearchOpen(false)}
              />
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                title="Search"
              >
                <SearchIcon className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Right side - Additional controls */}
      <div className="flex items-center space-x-2">
        {/* Selection info */}
        {selectedNodes.size > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
          >
            {selectedNodes.size} selected
            <button
              onClick={clearSelection}
              className="ml-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-200"
              title="Clear Selection"
            >
              ×
            </button>
          </motion.div>
        )}

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="relevance">Sort by Relevance</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>

        {/* Filter button */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
            isFilterOpen
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Filters"
        >
          <FilterIcon className="w-4 h-4" />
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          title="Refresh"
        >
          <RefreshCwIcon className="w-4 h-4" />
        </button>

        {/* Settings button */}
        <button className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Filter panel */}
      {isFilterOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute top-full right-4 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Type
              </label>
              <div className="space-y-2">
                {['All', 'Folder', 'Document', 'Image', 'PDF'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Size Range
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <input
                type="text"
                placeholder="Enter tags..."
                className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}