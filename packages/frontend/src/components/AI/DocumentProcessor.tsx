import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  FileTextIcon,
  TagIcon,
  SparklesIcon,
  BrainIcon,
  BarChart3Icon,
  DownloadIcon
} from 'lucide-react';
import { aiService } from '../../services/aiService';
import type { DocumentNode } from '@shared/types';

interface ProcessingJob {
  id: string;
  name: string;
  documents: DocumentNode[];
  operations: ('summarize' | 'embed' | 'analyze' | 'tag')[];
  status: 'pending' | 'running' | 'completed' | 'error' | 'paused';
  progress: {
    processed: number;
    total: number;
    errors: number;
  };
  results?: any[];
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

interface DocumentProcessorProps {
  documents: DocumentNode[];
  onProcessingComplete?: (results: any[]) => void;
}

export default function DocumentProcessor({ 
  documents, 
  onProcessingComplete 
}: DocumentProcessorProps) {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [selectedOperations, setSelectedOperations] = useState<('summarize' | 'embed' | 'analyze' | 'tag')[]>(['summarize', 'tag']);
  const [batchSize, setBatchSize] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);

  const operationOptions = [
    { 
      value: 'summarize' as const, 
      label: 'Generate Summaries', 
      icon: FileTextIcon, 
      description: 'Create AI-powered summaries and key points'
    },
    { 
      value: 'embed' as const, 
      label: 'Generate Embeddings', 
      icon: BrainIcon, 
      description: 'Create vector embeddings for semantic search'
    },
    { 
      value: 'analyze' as const, 
      label: 'Content Analysis', 
      icon: BarChart3Icon, 
      description: 'Analyze sentiment, complexity, and entities'
    },
    { 
      value: 'tag' as const, 
      label: 'Smart Tagging', 
      icon: TagIcon, 
      description: 'Generate intelligent tags and categories'
    }
  ];

  const createJob = () => {
    if (documents.length === 0 || selectedOperations.length === 0) return;

    const job: ProcessingJob = {
      id: `job_${Date.now()}`,
      name: `Process ${documents.length} documents`,
      documents,
      operations: selectedOperations,
      status: 'pending',
      progress: {
        processed: 0,
        total: documents.length,
        errors: 0
      }
    };

    setJobs(prev => [job, ...prev]);
    return job;
  };

  const startJob = async (job: ProcessingJob) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setCurrentJob(job);
    
    // Update job status
    setJobs(prev => prev.map(j => 
      j.id === job.id 
        ? { ...j, status: 'running', startTime: new Date() }
        : j
    ));

    try {
      const documentIds = job.documents.map(doc => doc.id);
      
      // Start batch processing
      const result = await aiService.batchProcessDocuments(
        documentIds,
        job.operations,
        batchSize
      );

      // Update job with results
      setJobs(prev => prev.map(j => 
        j.id === job.id 
          ? { 
              ...j, 
              status: 'completed',
              endTime: new Date(),
              progress: {
                processed: result.processed,
                total: job.documents.length,
                errors: result.errors
              },
              results: result.results
            }
          : j
      ));

      onProcessingComplete?.(result.results);
    } catch (error) {
      // Update job with error
      setJobs(prev => prev.map(j => 
        j.id === job.id 
          ? { 
              ...j, 
              status: 'error',
              endTime: new Date(),
              error: error instanceof Error ? error.message : 'Processing failed'
            }
          : j
      ));
    } finally {
      setIsProcessing(false);
      setCurrentJob(null);
    }
  };

  const pauseJob = (jobId: string) => {
    setJobs(prev => prev.map(j => 
      j.id === jobId 
        ? { ...j, status: 'paused' }
        : j
    ));
  };

  const stopJob = (jobId: string) => {
    setJobs(prev => prev.map(j => 
      j.id === jobId 
        ? { ...j, status: 'error', error: 'Stopped by user' }
        : j
    ));
    
    if (currentJob?.id === jobId) {
      setIsProcessing(false);
      setCurrentJob(null);
    }
  };

  const deleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const exportResults = (job: ProcessingJob) => {
    if (!job.results) return;

    const data = {
      jobName: job.name,
      operations: job.operations,
      processedAt: job.endTime,
      results: job.results
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processing_results_${job.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending': return LoaderIcon;
      case 'running': return PlayIcon;
      case 'completed': return CheckCircleIcon;
      case 'error': return AlertCircleIcon;
      case 'paused': return PauseIcon;
      default: return LoaderIcon;
    }
  };

  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'running': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'paused': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime) return '';
    const end = endTime || new Date();
    const duration = Math.round((end.getTime() - startTime.getTime()) / 1000);
    return `${duration}s`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Intelligent Document Processor
          </h3>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Batch process documents with AI-powered analysis and enhancement
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Operation Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Processing Operations
          </label>
          <div className="grid grid-cols-1 gap-3">
            {operationOptions.map((operation) => {
              const IconComponent = operation.icon;
              const isSelected = selectedOperations.includes(operation.value);
              
              return (
                <button
                  key={operation.value}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedOperations(prev => prev.filter(op => op !== operation.value));
                    } else {
                      setSelectedOperations(prev => [...prev, operation.value]);
                    }
                  }}
                  className={`flex items-center space-x-3 p-3 border rounded-lg transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${
                    isSelected ? 'text-purple-600' : 'text-gray-500'
                  }`} />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${
                      isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'
                    }`}>
                      {operation.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {operation.description}
                    </div>
                  </div>
                  <div className={`w-4 h-4 border-2 rounded ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isSelected && (
                      <CheckCircleIcon className="w-full h-full text-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Batch Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Batch Size: {batchSize} documents
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        {/* Documents Info */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Documents to process:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {documents.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600 dark:text-gray-400">Selected operations:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedOperations.length}
            </span>
          </div>
        </div>

        {/* Start Processing */}
        <button
          onClick={() => {
            const job = createJob();
            if (job) startJob(job);
          }}
          disabled={isProcessing || documents.length === 0 || selectedOperations.length === 0}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <LoaderIcon className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-5 h-5" />
              <span>Start Processing</span>
            </>
          )}
        </button>

        {/* Jobs List */}
        {jobs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Processing Jobs
            </h4>
            <div className="space-y-3">
              {jobs.map((job) => {
                const StatusIcon = getStatusIcon(job.status);
                const statusColor = getStatusColor(job.status);
                const progressPercent = job.progress.total > 0 
                  ? (job.progress.processed / job.progress.total) * 100 
                  : 0;
                
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {job.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getDuration(job.startTime, job.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {job.status === 'completed' && job.results && (
                          <button
                            onClick={() => exportResults(job)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Export Results"
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </button>
                        )}
                        {job.status === 'running' && (
                          <>
                            <button
                              onClick={() => pauseJob(job.id)}
                              className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                              title="Pause"
                            >
                              <PauseIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => stopJob(job.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Stop"
                            >
                              <StopIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {(job.status === 'completed' || job.status === 'error') && (
                          <button
                            onClick={() => deleteJob(job.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <StopIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>
                          {job.progress.processed} / {job.progress.total} processed
                        </span>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            job.status === 'error' ? 'bg-red-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Operations */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {job.operations.map((op) => (
                        <span
                          key={op}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                        >
                          {op}
                        </span>
                      ))}
                    </div>

                    {/* Error Message */}
                    {job.error && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        Error: {job.error}
                      </div>
                    )}

                    {/* Results Summary */}
                    {job.status === 'completed' && job.results && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        ✓ Completed successfully - {job.results.length} results generated
                        {job.progress.errors > 0 && ` (${job.progress.errors} errors)`}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}