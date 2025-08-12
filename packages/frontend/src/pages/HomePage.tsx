import { Link } from 'react-router-dom';
import { TreeIcon, SearchIcon, FolderIcon, FileTextIcon } from 'lucide-react';

export default function HomePage() {
  const stats = [
    { name: 'Total Documents', value: '2,847', icon: FileTextIcon },
    { name: 'Folders', value: '156', icon: FolderIcon },
    { name: 'Active Context', value: '42', icon: TreeIcon },
    { name: 'Recent Searches', value: '18', icon: SearchIcon },
  ];

  const quickActions = [
    {
      title: 'Browse Tree',
      description: 'Explore your document hierarchy',
      href: '/tree',
      icon: TreeIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Search Documents',
      description: 'Find specific content quickly',
      href: '/search',
      icon: SearchIcon,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Interactive Knowledge Tree
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and explore your knowledge documents with an intuitive visual interface
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-primary-300 dark:hover:border-primary-600 transition-colors duration-200"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <FileTextIcon className="mx-auto h-12 w-12 mb-4" />
            <p>No recent activity to display</p>
            <p className="text-sm mt-2">Start exploring your documents to see activity here</p>
          </div>
        </div>
      </div>
    </div>
  );
}