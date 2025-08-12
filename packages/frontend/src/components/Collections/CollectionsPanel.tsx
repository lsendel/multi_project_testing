import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlusIcon,
  FolderIcon,
  StarIcon,
  TagIcon,
  MoreHorizontalIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ShareIcon,
  DownloadIcon,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollection,
} from '../../services/api';
import type { DocumentNode } from '@shared/types';

interface CollectionsPanelProps {
  selectedNodes?: DocumentNode[];
  onLoadCollection?: (nodes: DocumentNode[]) => void;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
  nodes?: DocumentNode[];
}

export default function CollectionsPanel({ selectedNodes = [], onLoadCollection }: CollectionsPanelProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch collections
  const {
    data: collections = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  });

  // Create collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  // Update collection mutation
  const updateCollectionMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof updateCollection>[1]) =>
      updateCollection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setEditingCollection(null);
      resetForm();
    },
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const resetForm = () => {
    setNewCollectionName('');
    setNewCollectionDescription('');
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    createCollectionMutation.mutate({
      name: newCollectionName,
      description: newCollectionDescription,
      nodeIds: selectedNodes.map(node => node.id),
      rules: {
        includeSubfolders: false,
        autoUpdate: false,
      },
    });
  };

  const handleUpdateCollection = () => {
    if (!editingCollection || !newCollectionName.trim()) return;

    updateCollectionMutation.mutate({
      id: editingCollection.id,
      name: newCollectionName,
      description: newCollectionDescription,
    });
  };

  const handleDeleteCollection = (id: string) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      deleteCollectionMutation.mutate(id);
    }
  };

  const handleLoadCollection = async (collectionId: string) => {
    try {
      const collection = await getCollection(collectionId);
      onLoadCollection?.(collection.nodes);
    } catch (error) {
      console.error('Failed to load collection:', error);
    }
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setNewCollectionDescription(collection.description || '');
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Collections
          </h3>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Create Collection"
          >
            <FolderPlusIcon className="w-5 h-5" />
          </button>
        </div>
        
        {selectedNodes.length > 0 && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {selectedNodes.length} documents selected
          </div>
        )}
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading collections...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600 dark:text-red-400">
            <p>Failed to load collections</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="space-y-3">
            {collections.map((collection) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleLoadCollection(collection.id)}
                      className="flex items-center space-x-2 w-full text-left"
                    >
                      <FolderIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {collection.name}
                        </p>
                        {collection.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {collection.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{collection.nodeCount} items</span>
                          <span>•</span>
                          <span>{new Date(collection.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(collection)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Edit"
                    >
                      <EditIcon className="w-3 h-3" />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Share"
                    >
                      <ShareIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(collection.id)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {collections.length === 0 && !isLoading && !error && (
              <div className="text-center py-12">
                <FolderIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">No collections yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Create collections to organize your documents
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Smart Collections Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Smart Collections</h4>
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-2 p-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
            <StarIcon className="w-4 h-4 text-yellow-500" />
            <span>Recently Used</span>
          </button>
          <button className="w-full flex items-center space-x-2 p-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
            <TagIcon className="w-4 h-4 text-green-500" />
            <span>Tagged Documents</span>
          </button>
          <button className="w-full flex items-center space-x-2 p-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
            <FolderIcon className="w-4 h-4 text-blue-500" />
            <span>Large Documents</span>
          </button>
        </div>
      </div>

      {/* Create/Edit Collection Modal */}
      <AnimatePresence>
        {(isCreateModalOpen || editingCollection) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => {
              setIsCreateModalOpen(false);
              setEditingCollection(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingCollection ? 'Edit Collection' : 'Create Collection'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter collection name..."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Describe this collection..."
                  />
                </div>

                {!editingCollection && selectedNodes.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This collection will include {selectedNodes.length} selected document{selectedNodes.length !== 1 ? 's' : ''}.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingCollection(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingCollection ? handleUpdateCollection : handleCreateCollection}
                  disabled={!newCollectionName.trim() || createCollectionMutation.isPending || updateCollectionMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingCollection ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}