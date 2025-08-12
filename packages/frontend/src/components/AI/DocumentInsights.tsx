import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileTextIcon,
  TagIcon,
  TrendingUpIcon,
  UsersIcon,
  MapPinIcon,
  BrainIcon,
  SparklesIcon,
  LoaderIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from 'lucide-react';
import type { DocumentNode } from '@shared/types';

interface DocumentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  language: string;
  readabilityScore: number;
  keyEntities: {
    type: 'person' | 'organization' | 'location' | 'concept';
    entity: string;
    confidence: number;
  }[];
  summary: string;
  keyPoints: string[];
  suggestedTags: string[];
}

interface DocumentInsightsProps {
  document: DocumentNode;
  onApplyTags?: (tags: string[]) => void;
  onUpdateSummary?: (summary: string) => void;
}

export default function DocumentInsights({ 
  document, 
  onApplyTags,
  onUpdateSummary 
}: DocumentInsightsProps) {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      analyzeDocument();
    }
  }, [document.id]);

  const analyzeDocument = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate AI analysis (would call LLMService API in real implementation)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis result
      const mockAnalysis: DocumentAnalysis = {
        sentiment: 'positive',
        topics: ['software architecture', 'design patterns', 'best practices', 'implementation'],
        complexity: 'moderate',
        language: 'en',
        readabilityScore: 75,
        keyEntities: [
          { type: 'concept', entity: 'Design Patterns', confidence: 0.95 },
          { type: 'concept', entity: 'Architecture', confidence: 0.88 },
          { type: 'organization', entity: 'Software Engineering', confidence: 0.82 },
          { type: 'concept', entity: 'Best Practices', confidence: 0.79 }
        ],
        summary: `This document provides a comprehensive overview of ${document.name.toLowerCase()}, covering key concepts and practical implementations. It focuses on architectural patterns and development methodologies.`,
        keyPoints: [
          'Introduces fundamental concepts and terminology',
          'Provides practical implementation examples',
          'Discusses best practices and common pitfalls',
          'Includes performance considerations'
        ],
        suggestedTags: ['architecture', 'patterns', 'implementation', 'best-practices', 'design']
      };
      
      setAnalysis(mockAnalysis);
    } catch (err) {
      setError('Failed to analyze document');
      console.error('Document analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTags = () => {
    if (analysis?.suggestedTags && onApplyTags) {
      onApplyTags(analysis.suggestedTags);
    }
  };

  const handleApplySummary = () => {
    if (analysis?.summary && onUpdateSummary) {
      onUpdateSummary(analysis.summary);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-600 dark:text-green-400';
      case 'complex': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'person': return UsersIcon;
      case 'organization': return UsersIcon;
      case 'location': return MapPinIcon;
      case 'concept': return BrainIcon;
      default: return BrainIcon;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-3">
          <LoaderIcon className="w-6 h-6 animate-spin text-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Analyzing Document
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              AI is processing the content...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
          <AlertCircleIcon className="w-6 h-6" />
          <div>
            <p className="text-sm font-medium">Analysis Failed</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
        <button
          onClick={analyzeDocument}
          className="mt-4 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="text-center">
          <SparklesIcon className="w-8 h-8 text-purple-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Document Insights
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Get AI-powered analysis of this document
          </p>
          <button
            onClick={analyzeDocument}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            Analyze Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            Document Insights
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Summary Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <FileTextIcon className="w-4 h-4 text-blue-500" />
              <span>AI Summary</span>
            </h4>
            <button
              onClick={handleApplySummary}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Apply
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {analysis.summary}
          </p>
        </div>

        {/* Key Points */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span>Key Points</span>
          </h4>
          <ul className="space-y-2">
            {analysis.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Suggested Tags */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <TagIcon className="w-4 h-4 text-orange-500" />
              <span>Suggested Tags</span>
            </h4>
            <button
              onClick={handleApplyTags}
              className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
            >
              Apply
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.suggestedTags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Sentiment</span>
              <span className={`text-xs font-medium capitalize ${getSentimentColor(analysis.sentiment)}`}>
                {analysis.sentiment}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Complexity</span>
              <span className={`text-xs font-medium capitalize ${getComplexityColor(analysis.complexity)}`}>
                {analysis.complexity}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Readability</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {analysis.readabilityScore}/100
              </span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Language</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white uppercase">
                {analysis.language}
              </span>
            </div>
          </div>
        </div>

        {/* Key Entities */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <BrainIcon className="w-4 h-4 text-purple-500" />
            <span>Key Entities</span>
          </h4>
          <div className="space-y-2">
            {analysis.keyEntities.map((entity, index) => {
              const IconComponent = getEntityIcon(entity.type);
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-3 h-3 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{entity.entity}</span>
                    <span className="text-xs text-gray-500 capitalize">({entity.type})</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {Math.round(entity.confidence * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topics */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <TrendingUpIcon className="w-4 h-4 text-indigo-500" />
            <span>Topics</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.topics.map((topic, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}