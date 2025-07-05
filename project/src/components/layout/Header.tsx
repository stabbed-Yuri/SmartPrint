import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Printer, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Upload, 
  History, 
  Settings,
  Shield,
  Users,
  BarChart3
} from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home, public: true },
    { path: '/dashboard', label: 'Dashboard', icon: User, auth: true },
    { path: '/printing', label: 'Print', icon: Upload, auth: true },
    { path: '/printers', label: 'Printers', icon: Printer, auth: true },
    { path: '/jobs', label: 'Jobs', icon: History, auth: true },
    { path: '/profile', label: 'Profile', icon: Settings, auth: true },
    { path: '/admin', label: 'Admin', icon: Shield, admin: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.public) return true;
    if (item.admin) return user?.role === 'ADMIN';
    if (item.auth) return isAuthenticated;
    return false;
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Printer className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SmartPrint</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">৳{user?.balance?.toFixed(2)}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {!isAuthenticated && (
              <div className="pt-6 border-t border-gray-200 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {isAuthenticated && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4 px-4 py-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-lg">{user?.name}</p>
                    <p className="text-sm text-gray-500">৳{user?.balance?.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-md flex items-center space-x-3"
                >
                  <LogOut className="h-6 w-6" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;