import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Printer, 
  FileText, 
  BarChart3,
  Home,
  Settings
} from 'lucide-react';

const AdminNavbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      title: 'Dashboard',
      icon: Home,
      link: '/admin',
      color: 'bg-gray-600 hover:bg-gray-700',
      activeColor: 'bg-gray-800',
    },
    {
      title: 'Users',
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-500 hover:bg-blue-600',
      activeColor: 'bg-blue-700',
    },
    {
      title: 'Printers',
      icon: Printer,
      link: '/admin/printers',
      color: 'bg-green-500 hover:bg-green-600',
      activeColor: 'bg-green-700',
    },
    {
      title: 'Jobs',
      icon: FileText,
      link: '/admin/jobs',
      color: 'bg-purple-500 hover:bg-purple-600',
      activeColor: 'bg-purple-700',
    },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SmartPrint Admin</h1>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.link;
              
              return (
                <Link
                  key={item.link}
                  to={item.link}
                  className={`${
                    isActive ? item.activeColor : item.color
                  } text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2 min-w-0`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{item.title}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side - could add user menu, notifications, etc. */}
          <div className="flex items-center">
            <div className="ml-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="hidden sm:inline">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar; 