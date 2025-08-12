import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  BoltIcon, 
  LightBulbIcon, 
  TagIcon,
  DocumentTextIcon,
  LoaderIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from 'lucide-react';
import { useContextStore } from '../../stores/contextStore';
import { useTreeStore } from '../../stores/treeStore';
import type { DocumentNode } from '@shared/types';

interface AIInsight {
  type: 'summary' | 'tags' | 'analysis' | 'relationship' | 'optimization';
  title: string;
  content: string;
  confidence: number;
  actionable?: boolean;
  action?: () => void;
}

interface AIAssistantProps {
  selectedDocuments: DocumentNode[];
}

export default function AIAssistant({ selectedDocuments }: AIAssistantProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'optimize' | 'enhance'>('insights');
  
  const { currentSession, optimizeContext } = useContextStore();
  const { selectedNodes } = useTreeStore();

  // Generate AI insights when selection changes
  useEffect(() => {
    if (selectedDocuments.length > 0) {
      generateInsights();
    }
  }, [selectedDocuments]);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const newInsights: AIInsight[] = [];
      
      // Simulate AI analysis (would call LLMService in real implementation)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (selectedDocuments.length === 1) {
        const doc = selectedDocuments[0];
        newInsights.push(
          {
            type: 'summary',
            title: 'Document Summary',
            content: `This document covers ${doc.metadata.tags.slice(0, 3).join(', ')} with a focus on practical implementation. Key concepts include data structures and algorithmic approaches.`,
            confidence: 0.92
          },
          {
            type: 'tags',
            title: 'Smart Tags Suggestion',
            content: `Recommended tags: architecture, patterns, best-practices, implementation`,
            confidence: 0.87,
            actionable: true,
            action: () => console.log('Apply smart tags')
          }
        );
      } else if (selectedDocuments.length > 1) {
        newInsights.push(
          {
            type: 'relationship',
            title: 'Document Relationships',
            content: `Found ${selectedDocuments.length} related documents with 78% conceptual similarity. Strong connections around database design and API patterns.`,
            confidence: 0.84
          },
          {
            type: 'optimization',
            title: 'Context Optimization',
            content: `Current selection uses 3,247 tokens (81% of limit). Consider removing 2 least relevant documents to optimize for better LLM performance.`,
            confidence: 0.91,
            actionable: true,
            action: () => optimizeContext()
          }
        );
      }
      
      setInsights(newInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enhanceDocuments = async () => {
    setIsLoading(true);
    try {
      // Simulate document enhancement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInsights(prev => [
        ...prev,
        {
          type: 'analysis',
          title: 'Content Enhancement Complete',
          content: `Enhanced ${selectedDocuments.length} documents with improved structure, extracted metadata, and generated cross-references.`,
          confidence: 0.89
        }
      ]);
    } catch (error) {
      console.error('Error enhancing documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'summary': return DocumentTextIcon;
      case 'tags': return TagIcon;
      case 'analysis': return SparklesIcon;
      case 'relationship': return LightBulbIcon;
      case 'optimization': return BoltIcon;
      default: return SparklesIcon;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.8) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            AI Assistant
          </h3>
          {isLoading && (
            <LoaderIcon className="w-4 h-4 animate-spin text-purple-500" />
          )}
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'insights' as const, label: 'Insights', icon: LightBulbIcon },
                { id: 'optimize' as const, label: 'Optimize', icon: BoltIcon },
                { id: 'enhance' as const, label: 'Enhance', icon: SparklesIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'insights' && (
                <div className="space-y-4">
                  {selectedDocuments.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                      Select documents to get AI insights
                    </p>
                  ) : insights.length === 0 && !isLoading ? (
                    <div className="text-center py-8">
                      <button
                        onClick={generateInsights}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        Generate Insights
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {insights.map((insight, index) => {
                        const IconComponent = getInsightIcon(insight.type);
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-start space-x-3">
                              <IconComponent className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {insight.title}
                                  </h4>
                                  <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                                    {Math.round(insight.confidence * 100)}%
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {insight.content}
                                </p>
                                {insight.actionable && (
                                  <button
                                    onClick={insight.action}
                                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                                  >
                                    Apply Suggestion →
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'optimize' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Optimize your context selection for better AI performance
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700 dark:text-blue-300">Token Usage:</span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          {currentSession?.tokenUsage.total || 0} / 4000
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(((currentSession?.tokenUsage.total || 0) / 4000) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={optimizeContext}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      {isLoading ? 'Optimizing...' : 'Optimize Context'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'enhance' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Enhance documents with AI-powered improvements
                    </p>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                      {[
                        'Improve structure and formatting',
                        'Generate smart tags and metadata',
                        'Extract key concepts and entities',
                        'Suggest content improvements'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <SparklesIcon className="w-3 h-3 text-purple-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={enhanceDocuments}
                      disabled={isLoading || selectedDocuments.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      {isLoading ? 'Enhancing...' : `Enhance ${selectedDocuments.length} Document${selectedDocuments.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}