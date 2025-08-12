import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  PaletteIcon,
  BellIcon,
  ShieldIcon,
  DatabaseIcon,
  KeyIcon,
  GlobeIcon,
  HelpCircleIcon,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: UserIcon },
    { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'privacy', label: 'Privacy', icon: ShieldIcon },
    { id: 'data', label: 'Data & Storage', icon: DatabaseIcon },
    { id: 'api', label: 'API Keys', icon: KeyIcon },
    { id: 'integrations', label: 'Integrations', icon: GlobeIcon },
    { id: 'help', label: 'Help & Support', icon: HelpCircleIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                General Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Tree Expansion Level
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="1">Level 1</option>
                    <option value="2" selected>Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="all">Expand All</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Sort Order
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="name" selected>Name</option>
                    <option value="date">Date Modified</option>
                    <option value="size">Size</option>
                    <option value="relevance">Relevance</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable Animations
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Smooth transitions and visual effects
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-include Related Documents
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Automatically suggest related documents for context
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Appearance Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="flex items-center justify-center p-3 border-2 border-blue-500 rounded-lg bg-white text-gray-900">
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    <button className="flex items-center justify-center p-3 border-2 border-gray-300 rounded-lg bg-gray-900 text-white">
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                    <button className="flex items-center justify-center p-3 border-2 border-gray-300 rounded-lg bg-gradient-to-r from-white to-gray-900 text-gray-900">
                      <span className="text-sm font-medium">Auto</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="small">Small</option>
                    <option value="medium" selected>Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      High Contrast Mode
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Increase contrast for better readability
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reduced Motion
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Minimize animations for accessibility
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Settings for "{tabs.find(t => t.id === activeTab)?.label}" will be implemented here
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
        </div>
        <nav className="px-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}