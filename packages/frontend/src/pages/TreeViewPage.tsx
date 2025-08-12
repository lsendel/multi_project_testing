import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircleIcon, LoaderIcon } from 'lucide-react';

import TreeControls from '../components/Tree/TreeControls';
import TreeVisualization from '../components/Tree/TreeVisualization';
import ContextPanel from '../components/Context/ContextPanel';
import { useTreeStore } from '../stores/treeStore';
import { useContextStore } from '../stores/contextStore';
import { fetchDocuments } from '../services/api';
import type { DocumentNode } from '@shared/types';

export default function TreeViewPage() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  
  const {
    setNodes,
    setLoading,
    setError,
    isLoading: treeLoading,
    error: treeError,
  } = useTreeStore();

  const {
    updateTokenUsage,
    updateAnalytics,
    generateSuggestions,
  } = useContextStore();

  // Fetch documents from API
  const {
    data: documents,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  // Update tree store when documents are loaded
  useEffect(() => {
    if (documents) {
      setNodes(documents);
      setError(null);
      
      // Update context analytics
      updateAnalytics(documents);
      
      // Generate suggestions
      generateSuggestions(documents);
    }
    setLoading(isLoading);
  }, [documents, isLoading, setNodes, setLoading, setError, updateAnalytics, generateSuggestions]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setError(error instanceof Error ? error.message : 'Failed to load documents');
    }
  }, [error, setError]);

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('tree-container');
      if (container) {
        setContainerDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
  const handleResetZoom = () => setZoomLevel(1);

  const handleRefresh = () => {
    refetch();
  };

  // Update token usage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateTokenUsage();
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [updateTokenUsage]);

  if (isLoading || treeLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <LoaderIcon className="w-8 h-8 animate-spin text-blue-500" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Loading Document Tree
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fetching your knowledge base...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || treeError) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4 max-w-md text-center"
        >
          <AlertCircleIcon className="w-12 h-12 text-red-500" />
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to Load Documents
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error?.message || treeError || 'An error occurred while loading the document tree.'}
            </p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Tree controls */}
        <TreeControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onRefresh={handleRefresh}
        />

        {/* Tree visualization */}
        <div className="flex-1 relative overflow-hidden">
          <div
            id="tree-container"
            className="absolute inset-0 p-4"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
          >
            <TreeVisualization
              width={containerDimensions.width}
              height={containerDimensions.height}
              data={documents || []}
            />
          </div>
          
          {/* Zoom level indicator */}
          <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>

      {/* Context panel */}
      <ContextPanel />
    </div>
  );
}