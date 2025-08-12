import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BrainIcon,
  SettingsIcon,
  ZapIcon,
  BarChart3Icon,
  FileTextIcon,
  SparklesIcon,
  TrendingUpIcon,
  ClockIcon
} from 'lucide-react';
import { useTreeStore } from '../stores/treeStore';
import { useContextStore } from '../stores/contextStore';
import AISettings from '../components/AI/AISettings';
import DocumentProcessor from '../components/AI/DocumentProcessor';
import WorkflowBuilder from '../components/AI/WorkflowBuilder';
import DocumentInsights from '../components/AI/DocumentInsights';
import { aiService } from '../services/aiService';
import type { DocumentNode } from '@shared/types';

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'processor' | 'workflows' | 'insights'>('overview');
  const [selectedDocument, setSelectedDocument] = useState<DocumentNode | null>(null);
  const [aiConfig, setAiConfig] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const { nodes } = useTreeStore();
  const { currentSession } = useContextStore();

  const documentsArray = Array.from(nodes.values());
  const selectedDocuments = currentSession 
    ? Array.from(currentSession.includedNodes).map(id => nodes.get(id)).filter(Boolean)
    : [];

  useEffect(() => {
    checkAIConfiguration();
    loadUsageStats();
  }, []);

  const checkAIConfiguration = async () => {
    try {
      const config = await aiService.getConfiguration();
      setIsConfigured(!!config);
      setAiConfig(config);
    } catch (error) {
      console.error('Error checking AI configuration:', error);
      setIsConfigured(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const stats = await aiService.getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3Icon },
    { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
    { id: 'processor' as const, label: 'Processor', icon: SparklesIcon },
    { id: 'workflows' as const, label: 'Workflows', icon: ZapIcon },
    { id: 'insights' as const, label: 'Insights', icon: BrainIcon }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* AI Status */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            AI Service Status
          </h3>
          {isConfigured ? (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-sm">Not Configured</span>
            </div>
          )}
        </div>

        {isConfigured ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {usageStats?.totalRequests || 0}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Requests</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {usageStats?.totalTokensUsed?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Tokens Used</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {usageStats?.averageResponseTime || 0}ms
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Avg Response</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {((1 - (usageStats?.errorRate || 0)) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Success Rate</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BrainIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              AI Service Not Configured
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Configure your AI provider to unlock intelligent document processing
            </p>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Configure Now
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('processor')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-left hover:border-blue-500 transition-colors"
        >
          <SparklesIcon className="w-8 h-8 text-purple-500 mb-3" />
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            Process Documents
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Run AI operations on your documents in batches
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('workflows')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-left hover:border-blue-500 transition-colors"
        >
          <ZapIcon className="w-8 h-8 text-yellow-500 mb-3" />
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            Create Workflow
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automate document processing with intelligent workflows
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('insights')}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-left hover:border-blue-500 transition-colors"
        >
          <BrainIcon className="w-8 h-8 text-blue-500 mb-3" />
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            Document Insights
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get AI-powered analysis and insights for documents
          </p>
        </motion.button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent AI Activity
        </h3>
        <div className="space-y-3">
          {[
            { action: 'Document Analysis', time: '2 minutes ago', status: 'completed' },
            { action: 'Batch Processing', time: '15 minutes ago', status: 'completed' },
            { action: 'Workflow Execution', time: '1 hour ago', status: 'completed' },
            { action: 'Smart Tagging', time: '2 hours ago', status: 'completed' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-900 dark:text-white">
                  {activity.action}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="w-3 h-3" />
                <span>{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      
      case 'settings':
        return (
          <AISettings 
            onConfigUpdate={(config) => {
              setAiConfig(config);
              setIsConfigured(!!config);
            }} 
          />
        );
      
      case 'processor':
        return (
          <DocumentProcessor 
            documents={documentsArray}
            onProcessingComplete={(results) => {
              console.log('Processing completed:', results);
              loadUsageStats(); // Reload stats after processing
            }}
          />
        );
      
      case 'workflows':
        return (
          <WorkflowBuilder 
            documents={documentsArray}
            onWorkflowRun={(workflow, results) => {
              console.log('Workflow completed:', workflow, results);
              loadUsageStats(); // Reload stats after workflow
            }}
          />
        );
      
      case 'insights':
        return (
          <div className="space-y-6">
            {/* Document Selection */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Select Document for Analysis
              </h4>
              <select
                value={selectedDocument?.id || ''}
                onChange={(e) => {
                  const doc = documentsArray.find(d => d.id === e.target.value);
                  setSelectedDocument(doc || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Choose a document...</option>
                {documentsArray.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Insights */}
            {selectedDocument ? (
              <DocumentInsights 
                document={selectedDocument}
                onApplyTags={(tags) => {
                  console.log('Apply tags:', tags);
                }}
                onUpdateSummary={(summary) => {
                  console.log('Update summary:', summary);
                }}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Document Selected
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a document above to see AI-powered insights and analysis
                </p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Intelligence Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Advanced AI features for intelligent document processing
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Documents: {documentsArray.length}
              </div>
              {selectedDocuments.length > 0 && (
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Selected: {selectedDocuments.length}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}