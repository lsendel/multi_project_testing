import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  SettingsIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  EyeIcon,
  EyeOffIcon,
  ZapIcon,
  BrainIcon,
  ServerIcon
} from 'lucide-react';
import { aiService } from '../../services/aiService';
import type { AIConfig } from '../../services/aiService';

interface AISettingsProps {
  onConfigUpdate?: (config: AIConfig | null) => void;
}

export default function AISettings({ onConfigUpdate }: AISettingsProps) {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const savedConfig = await aiService.getConfiguration();
      if (savedConfig) {
        setConfig(prev => ({ ...prev, ...savedConfig }));
        setIsConfigured(true);
        onConfigUpdate?.(savedConfig);
      }
    } catch (error) {
      console.error('Error loading AI configuration:', error);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!config.apiKey && config.provider !== 'local') {
      setTestStatus('error');
      setTestMessage('API key is required for this provider');
      return;
    }

    setIsLoading(true);
    setTestStatus('idle');
    
    try {
      await aiService.configure(config);
      setIsConfigured(true);
      setTestStatus('success');
      setTestMessage('Configuration saved successfully');
      onConfigUpdate?.(config);
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : 'Configuration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConfiguration = async () => {
    setIsTesting(true);
    setTestStatus('idle');
    
    try {
      const health = await aiService.healthCheck();
      
      if (health.status === 'healthy') {
        setTestStatus('success');
        setTestMessage(`Connected successfully! Latency: ${health.latency}ms`);
      } else {
        setTestStatus('error');
        setTestMessage(`Service is ${health.status}: ${health.error || 'Unknown error'}`);
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai': return BrainIcon;
      case 'anthropic': return ZapIcon;
      case 'local': return ServerIcon;
      default: return BrainIcon;
    }
  };

  const getModelOptions = (provider: string) => {
    switch (provider) {
      case 'openai':
        return [
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
          { value: 'text-embedding-ada-002', label: 'Ada Embeddings' }
        ];
      case 'anthropic':
        return [
          { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
          { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
        ];
      case 'local':
        return [
          { value: 'llama2', label: 'Llama 2' },
          { value: 'mistral', label: 'Mistral' },
          { value: 'codellama', label: 'Code Llama' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            AI Configuration
          </h3>
          {isConfigured && (
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="text-sm">Configured</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            AI Provider
          </label>
          <div className="grid grid-cols-1 gap-3">
            {[
              { value: 'openai', label: 'OpenAI', description: 'GPT-4, GPT-3.5, Embeddings' },
              { value: 'anthropic', label: 'Anthropic', description: 'Claude 3 models' },
              { value: 'local', label: 'Local/Ollama', description: 'Self-hosted models' }
            ].map((provider) => {
              const IconComponent = getProviderIcon(provider.value);
              return (
                <button
                  key={provider.value}
                  onClick={() => setConfig(prev => ({ 
                    ...prev, 
                    provider: provider.value as AIConfig['provider'],
                    model: getModelOptions(provider.value)[0]?.value || ''
                  }))}
                  className={`flex items-center space-x-3 p-3 border rounded-lg transition-all ${
                    config.provider === provider.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${
                    config.provider === provider.value ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${
                      config.provider === provider.value ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                    }`}>
                      {provider.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {provider.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model
          </label>
          <select
            value={config.model}
            onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {getModelOptions(config.provider).map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        {config.provider !== 'local' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={`Enter your ${config.provider} API key`}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showApiKey ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Base URL for local provider */}
        {config.provider === 'local' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base URL
            </label>
            <input
              type="url"
              value={config.baseUrl || 'http://localhost:11434/v1'}
              onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="http://localhost:11434/v1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {/* Test Status */}
        {testStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg flex items-center space-x-2 ${
              testStatus === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}
          >
            {testStatus === 'success' ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : (
              <AlertCircleIcon className="w-4 h-4" />
            )}
            <span className="text-sm">{testMessage}</span>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveConfiguration}
            disabled={isLoading || !config.model || (!config.apiKey && config.provider !== 'local')}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <LoaderIcon className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircleIcon className="w-4 h-4" />
            )}
            <span>Save Configuration</span>
          </button>
          
          {isConfigured && (
            <button
              onClick={handleTestConfiguration}
              disabled={isTesting}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              {isTesting ? (
                <LoaderIcon className="w-4 h-4 animate-spin" />
              ) : (
                'Test Connection'
              )}
            </button>
          )}
        </div>

        {/* Configuration Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Configuration Tips:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>OpenAI: Get your API key from platform.openai.com</li>
              <li>Anthropic: Get your API key from console.anthropic.com</li>
              <li>Local: Ensure Ollama is running on the specified URL</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}