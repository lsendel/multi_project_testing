import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PlusIcon,
  TrashIcon,
  SettingsIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ZapIcon,
  GitBranchIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon
} from 'lucide-react';
import DocumentProcessor from './DocumentProcessor';
import type { DocumentNode } from '@shared/types';

interface WorkflowStep {
  id: string;
  type: 'filter' | 'process' | 'analyze' | 'condition' | 'action';
  name: string;
  description: string;
  config: Record<string, any>;
  enabled: boolean;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  trigger: 'manual' | 'scheduled' | 'automatic';
  schedule?: string;
  status: 'draft' | 'active' | 'paused' | 'error';
  lastRun?: Date;
  nextRun?: Date;
  stats: {
    totalRuns: number;
    successRuns: number;
    failedRuns: number;
    documentsProcessed: number;
  };
}

interface WorkflowBuilderProps {
  documents: DocumentNode[];
  onWorkflowRun?: (workflow: Workflow, results: any) => void;
}

export default function WorkflowBuilder({ documents, onWorkflowRun }: WorkflowBuilderProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showStepLibrary, setShowStepLibrary] = useState(false);

  // Predefined workflow templates
  const workflowTemplates = [
    {
      id: 'content-analysis',
      name: 'Content Analysis Pipeline',
      description: 'Analyze content sentiment, extract entities, and generate tags',
      steps: [
        {
          id: 'filter-1',
          type: 'filter' as const,
          name: 'Filter by Type',
          description: 'Include only document files',
          config: { fileTypes: ['document', 'text'] },
          enabled: true
        },
        {
          id: 'process-1',
          type: 'process' as const,
          name: 'Analyze Content',
          description: 'Run AI analysis on document content',
          config: { operations: ['analyze', 'tag'] },
          enabled: true
        },
        {
          id: 'action-1',
          type: 'action' as const,
          name: 'Update Metadata',
          description: 'Apply generated tags to documents',
          config: { updateTags: true, updateMetadata: true },
          enabled: true
        }
      ]
    },
    {
      id: 'embedding-generation',
      name: 'Embedding Generation',
      description: 'Generate embeddings for semantic search',
      steps: [
        {
          id: 'filter-2',
          type: 'filter' as const,
          name: 'Filter Missing Embeddings',
          description: 'Process only documents without embeddings',
          config: { missingEmbeddings: true },
          enabled: true
        },
        {
          id: 'process-2',
          type: 'process' as const,
          name: 'Generate Embeddings',
          description: 'Create vector embeddings for documents',
          config: { operations: ['embed'] },
          enabled: true
        }
      ]
    },
    {
      id: 'smart-summarization',
      name: 'Smart Summarization',
      description: 'Generate summaries and key points for documents',
      steps: [
        {
          id: 'condition-1',
          type: 'condition' as const,
          name: 'Check Length',
          description: 'Only summarize documents longer than 1000 characters',
          config: { minLength: 1000 },
          enabled: true
        },
        {
          id: 'process-3',
          type: 'process' as const,
          name: 'Generate Summary',
          description: 'Create AI-powered summaries',
          config: { operations: ['summarize'] },
          enabled: true
        },
        {
          id: 'action-2',
          type: 'action' as const,
          name: 'Save Results',
          description: 'Update document previews with summaries',
          config: { updatePreview: true },
          enabled: true
        }
      ]
    }
  ];

  // Available step types
  const stepTypes = [
    {
      type: 'filter',
      name: 'Filter Documents',
      description: 'Filter documents based on criteria',
      icon: GitBranchIcon,
      configFields: [
        { key: 'fileTypes', label: 'File Types', type: 'multiselect', options: ['document', 'text', 'folder'] },
        { key: 'tags', label: 'Required Tags', type: 'text' },
        { key: 'dateRange', label: 'Date Range', type: 'daterange' }
      ]
    },
    {
      type: 'process',
      name: 'AI Processing',
      description: 'Run AI operations on documents',
      icon: ZapIcon,
      configFields: [
        { key: 'operations', label: 'Operations', type: 'multiselect', options: ['summarize', 'embed', 'analyze', 'tag'] },
        { key: 'batchSize', label: 'Batch Size', type: 'number', default: 5 }
      ]
    },
    {
      type: 'condition',
      name: 'Conditional Logic',
      description: 'Apply conditional logic',
      icon: GitBranchIcon,
      configFields: [
        { key: 'condition', label: 'Condition', type: 'select', options: ['length', 'type', 'tags'] },
        { key: 'value', label: 'Value', type: 'text' }
      ]
    },
    {
      type: 'action',
      name: 'Update Documents',
      description: 'Apply changes to documents',
      icon: CheckCircleIcon,
      configFields: [
        { key: 'updateTags', label: 'Update Tags', type: 'checkbox' },
        { key: 'updateMetadata', label: 'Update Metadata', type: 'checkbox' },
        { key: 'updatePreview', label: 'Update Preview', type: 'checkbox' }
      ]
    }
  ];

  const createWorkflowFromTemplate = (template: typeof workflowTemplates[0]) => {
    const workflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name: template.name,
      description: template.description,
      steps: template.steps,
      trigger: 'manual',
      status: 'draft',
      stats: {
        totalRuns: 0,
        successRuns: 0,
        failedRuns: 0,
        documentsProcessed: 0
      }
    };

    setWorkflows(prev => [workflow, ...prev]);
    setSelectedWorkflow(workflow);
    setIsBuilding(true);
  };

  const createCustomWorkflow = () => {
    const workflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name: 'Custom Workflow',
      description: 'A custom document processing workflow',
      steps: [],
      trigger: 'manual',
      status: 'draft',
      stats: {
        totalRuns: 0,
        successRuns: 0,
        failedRuns: 0,
        documentsProcessed: 0
      }
    };

    setWorkflows(prev => [workflow, ...prev]);
    setSelectedWorkflow(workflow);
    setIsBuilding(true);
  };

  const addStep = (stepType: typeof stepTypes[0]) => {
    if (!selectedWorkflow) return;

    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type: stepType.type as WorkflowStep['type'],
      name: stepType.name,
      description: stepType.description,
      config: {},
      enabled: true
    };

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: [...selectedWorkflow.steps, newStep]
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(prev => prev.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
  };

  const removeStep = (stepId: string) => {
    if (!selectedWorkflow) return;

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.filter(s => s.id !== stepId)
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(prev => prev.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
  };

  const toggleStep = (stepId: string) => {
    if (!selectedWorkflow) return;

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.map(s => 
        s.id === stepId ? { ...s, enabled: !s.enabled } : s
      )
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(prev => prev.map(w => w.id === selectedWorkflow.id ? updatedWorkflow : w));
  };

  const runWorkflow = async (workflow: Workflow) => {
    setIsRunning(true);
    
    try {
      // Simulate workflow execution
      let processedDocuments = documents;
      const results = [];

      for (const step of workflow.steps.filter(s => s.enabled)) {
        switch (step.type) {
          case 'filter':
            // Apply filtering logic
            if (step.config.fileTypes) {
              processedDocuments = processedDocuments.filter(doc => 
                step.config.fileTypes.includes(doc.type)
              );
            }
            break;
          
          case 'process':
            // Run AI processing
            const operations = step.config.operations || [];
            for (const doc of processedDocuments) {
              // Simulate processing delay
              await new Promise(resolve => setTimeout(resolve, 100));
              results.push({
                documentId: doc.id,
                step: step.name,
                operations
              });
            }
            break;
          
          case 'condition':
            // Apply conditional logic
            if (step.config.minLength) {
              processedDocuments = processedDocuments.filter(doc => 
                (doc.content?.fullText?.length || 0) >= step.config.minLength
              );
            }
            break;
          
          case 'action':
            // Apply actions
            results.push({
              step: step.name,
              action: 'documents_updated',
              count: processedDocuments.length
            });
            break;
        }
      }

      // Update workflow stats
      const updatedWorkflow = {
        ...workflow,
        lastRun: new Date(),
        stats: {
          ...workflow.stats,
          totalRuns: workflow.stats.totalRuns + 1,
          successRuns: workflow.stats.successRuns + 1,
          documentsProcessed: workflow.stats.documentsProcessed + processedDocuments.length
        }
      };

      setWorkflows(prev => prev.map(w => w.id === workflow.id ? updatedWorkflow : w));
      onWorkflowRun?.(updatedWorkflow, results);
    } catch (error) {
      console.error('Workflow execution error:', error);
      
      // Update error stats
      const updatedWorkflow = {
        ...workflow,
        lastRun: new Date(),
        status: 'error' as const,
        stats: {
          ...workflow.stats,
          totalRuns: workflow.stats.totalRuns + 1,
          failedRuns: workflow.stats.failedRuns + 1
        }
      };

      setWorkflows(prev => prev.map(w => w.id === workflow.id ? updatedWorkflow : w));
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (type: WorkflowStep['type']) => {
    const stepType = stepTypes.find(st => st.type === type);
    return stepType?.icon || CheckCircleIcon;
  };

  if (isBuilding && selectedWorkflow) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg h-full flex flex-col">
        {/* Builder Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedWorkflow.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedWorkflow.description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => runWorkflow(selectedWorkflow)}
                disabled={isRunning || selectedWorkflow.steps.length === 0}
                className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isRunning ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayIcon className="w-4 h-4" />
                )}
                <span>Run</span>
              </button>
              <button
                onClick={() => setIsBuilding(false)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Steps Editor */}
          <div className="flex-1 p-4">
            <div className="space-y-3">
              {selectedWorkflow.steps.map((step, index) => {
                const StepIcon = getStepIcon(step.type);
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-3 ${
                      step.enabled 
                        ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {index + 1}
                          </span>
                          <StepIcon className={`w-4 h-4 ${
                            step.enabled ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h4 className={`font-medium ${
                            step.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                          }`}>
                            {step.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleStep(step.id)}
                          className={`w-8 h-4 rounded-full transition-colors ${
                            step.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                            step.enabled ? 'translate-x-4' : 'translate-x-0.5'
                          }`} />
                        </button>
                        <button
                          onClick={() => removeStep(step.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add Step Button */}
              <button
                onClick={() => setShowStepLibrary(true)}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">Add Step</span>
              </button>
            </div>
          </div>

          {/* Step Library */}
          <AnimatePresence>
            {showStepLibrary && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Step Library</h4>
                  <button
                    onClick={() => setShowStepLibrary(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2">
                  {stepTypes.map((stepType) => {
                    const Icon = stepType.icon;
                    return (
                      <button
                        key={stepType.type}
                        onClick={() => {
                          addStep(stepType);
                          setShowStepLibrary(false);
                        }}
                        className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {stepType.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {stepType.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Intelligent Workflows
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automate document processing with AI-powered workflows
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={createCustomWorkflow}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Custom Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Templates */}
        {workflows.length === 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Workflow Templates
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {workflowTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => createWorkflowFromTemplate(template)}
                  className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    {template.name}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {template.description}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>{template.steps.length} steps</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Existing Workflows */}
        {workflows.length > 0 && (
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {workflow.name}
                      </h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        workflow.status === 'active' ? 'bg-green-100 text-green-700' :
                        workflow.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {workflow.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {workflow.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{workflow.steps.length} steps</span>
                      <span>{workflow.stats.totalRuns} runs</span>
                      <span>{workflow.stats.documentsProcessed} docs processed</span>
                      {workflow.lastRun && (
                        <span>Last run: {workflow.lastRun.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => runWorkflow(workflow)}
                      disabled={isRunning}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Run Workflow"
                    >
                      {isRunning ? (
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setIsBuilding(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit Workflow"
                    >
                      <SettingsIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {workflows.length === 0 && (
          <div className="text-center py-8">
            <ZapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Workflows Yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first workflow to automate document processing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}