import { NavLink } from 'react-router-dom';
import { TreeIcon, SearchIcon, HomeIcon, SettingsIcon, BarChart3Icon } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Tree View', href: '/tree', icon: TreeIcon },
  { name: 'Search', href: '/search', icon: SearchIcon },
  { name: 'Analytics', href: '/analytics', icon: BarChart3Icon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <TreeIcon className="h-8 w-8 text-primary-600" />
          <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
            Knowledge Tree
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Interactive Knowledge Tree v1.0
          </div>
        </div>
      </div>
    </div>
  );
}