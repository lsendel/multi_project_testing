import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUpIcon,
  SearchIcon,
  FileTextIcon,
  EyeIcon,
  ClockIcon,
  BarChart3Icon,
  PieChartIcon,
  ActivityIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSearchAnalytics } from '../../services/api';

interface AnalyticsData {
  topQueries: { query: string; count: number }[];
  searchVolume: { date: string; count: number }[];
  averageResultCount: number;
  documentStats: {
    totalDocuments: number;
    mostViewed: { id: string; name: string; views: number }[];
    recentlyAdded: number;
    averageSize: number;
  };
  contextStats: {
    averageContextSize: number;
    mostUsedInContext: { id: string; name: string; usage: number }[];
    contextEfficiency: number;
  };
  performanceStats: {
    averageSearchTime: number;
    averageLoadTime: number;
    apiResponseTime: number;
  };
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'documents' | 'context'>('overview');

  // Fetch analytics data
  const {
    data: searchAnalytics,
    isLoading: searchLoading,
    error: searchError,
  } = useQuery({
    queryKey: ['searchAnalytics', timeRange],
    queryFn: getSearchAnalytics,
    refetchInterval: 60000, // Refresh every minute
  });

  // Mock data for demonstration - in real app would come from APIs
  const mockAnalytics: AnalyticsData = {
    topQueries: searchAnalytics?.topQueries || [
      { query: 'documentation', count: 156 },
      { query: 'API reference', count: 134 },
      { query: 'tutorial', count: 98 },
      { query: 'configuration', count: 76 },
      { query: 'troubleshooting', count: 62 },
    ],
    searchVolume: searchAnalytics?.searchVolume || [
      { date: '2024-01-01', count: 45 },
      { date: '2024-01-02', count: 52 },
      { date: '2024-01-03', count: 38 },
      { date: '2024-01-04', count: 61 },
      { date: '2024-01-05', count: 49 },
      { date: '2024-01-06', count: 55 },
      { date: '2024-01-07', count: 43 },
    ],
    averageResultCount: searchAnalytics?.averageResultCount || 12.5,
    documentStats: {
      totalDocuments: 2847,
      mostViewed: [
        { id: '1', name: 'Getting Started Guide', views: 489 },
        { id: '2', name: 'API Documentation', views: 356 },
        { id: '3', name: 'Configuration Reference', views: 298 },
        { id: '4', name: 'Troubleshooting Guide', views: 234 },
        { id: '5', name: 'Best Practices', views: 198 },
      ],
      recentlyAdded: 23,
      averageSize: 45.7, // KB
    },
    contextStats: {
      averageContextSize: 8.3,
      mostUsedInContext: [
        { id: '1', name: 'Core Concepts', usage: 187 },
        { id: '2', name: 'Quick Reference', usage: 143 },
        { id: '3', name: 'Examples', usage: 129 },
        { id: '4', name: 'FAQ', usage: 98 },
        { id: '5', name: 'Glossary', usage: 76 },
      ],
      contextEfficiency: 0.82,
    },
    performanceStats: {
      averageSearchTime: 145, // ms
      averageLoadTime: 320, // ms
      apiResponseTime: 89, // ms
    },
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: any;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            {change && (
              <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {change}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </motion.div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Searches"
          value={mockAnalytics.searchVolume.reduce((sum, day) => sum + day.count, 0)}
          change="+12.5%"
          icon={SearchIcon}
          color="blue"
        />
        <StatCard
          title="Documents"
          value={mockAnalytics.documentStats.totalDocuments.toLocaleString()}
          change="+23"
          icon={FileTextIcon}
          color="green"
        />
        <StatCard
          title="Avg. Results"
          value={mockAnalytics.averageResultCount.toFixed(1)}
          change="+2.3"
          icon={TrendingUpIcon}
          color="purple"
        />
        <StatCard
          title="Context Usage"
          value={`${(mockAnalytics.contextStats.contextEfficiency * 100).toFixed(0)}%`}
          change="+5.2%"
          icon={ActivityIcon}
          color="orange"
        />
      </div>

      {/* Charts would go here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Search Volume Trend
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <BarChart3Icon className="w-16 h-16" />
            <p className="ml-4">Chart visualization would be here</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Document Types
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <PieChartIcon className="w-16 h-16" />
            <p className="ml-4">Pie chart visualization would be here</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearchAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Avg. Search Time"
          value={`${mockAnalytics.performanceStats.averageSearchTime}ms`}
          change="-23ms"
          icon={ClockIcon}
          color="green"
        />
        <StatCard
          title="Total Queries"
          value={mockAnalytics.topQueries.reduce((sum, q) => sum + q.count, 0)}
          change="+156"
          icon={SearchIcon}
          color="blue"
        />
        <StatCard
          title="Avg. Results"
          value={mockAnalytics.averageResultCount.toFixed(1)}
          change="+0.8"
          icon={TrendingUpIcon}
          color="purple"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Search Queries
        </h3>
        <div className="space-y-3">
          {mockAnalytics.topQueries.map((query, index) => (
            <div key={query.query} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                  {index + 1}
                </span>
                <span className="text-gray-900 dark:text-white">{query.query}</span>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {query.count} searches
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDocumentAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Documents"
          value={mockAnalytics.documentStats.totalDocuments.toLocaleString()}
          change="+47"
          icon={FileTextIcon}
          color="blue"
        />
        <StatCard
          title="Recently Added"
          value={mockAnalytics.documentStats.recentlyAdded}
          change="+12"
          icon={TrendingUpIcon}
          color="green"
        />
        <StatCard
          title="Avg. Size"
          value={`${mockAnalytics.documentStats.averageSize}KB`}
          change="-2.3KB"
          icon={ActivityIcon}
          color="purple"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Most Viewed Documents
        </h3>
        <div className="space-y-3">
          {mockAnalytics.documentStats.mostViewed.map((doc, index) => (
            <div key={doc.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                  {index + 1}
                </span>
                <span className="text-gray-900 dark:text-white">{doc.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <EyeIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {doc.views}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContextAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Avg. Context Size"
          value={mockAnalytics.contextStats.averageContextSize.toFixed(1)}
          change="+0.4"
          icon={ActivityIcon}
          color="blue"
        />
        <StatCard
          title="Context Efficiency"
          value={`${(mockAnalytics.contextStats.contextEfficiency * 100).toFixed(0)}%`}
          change="+3.2%"
          icon={TrendingUpIcon}
          color="green"
        />
        <StatCard
          title="Total Usage"
          value={mockAnalytics.contextStats.mostUsedInContext.reduce((sum, item) => sum + item.usage, 0)}
          change="+87"
          icon={EyeIcon}
          color="purple"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Most Used in Context
        </h3>
        <div className="space-y-3">
          {mockAnalytics.contextStats.mostUsedInContext.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                  {index + 1}
                </span>
                <span className="text-gray-900 dark:text-white">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.usage} times
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor usage patterns and system performance
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'search', label: 'Search' },
            { key: 'documents', label: 'Documents' },
            { key: 'context', label: 'Context' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Time Range */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'search' && renderSearchAnalytics()}
        {activeTab === 'documents' && renderDocumentAnalytics()}
        {activeTab === 'context' && renderContextAnalytics()}
      </motion.div>
    </div>
  );
}