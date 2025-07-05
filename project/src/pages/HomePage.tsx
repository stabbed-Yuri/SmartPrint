import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrinters, usePrinterStatus } from '../hooks/useApi';
import { Printer, MapPin, Clock, FileText, Users, Zap } from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { data: printers = [], isLoading: printersLoading } = usePrinters();
  const { data: printerStatus } = usePrinterStatus();

  const onlinePrinters = printers.filter(p => p.status === 'ONLINE');
  const locations = [...new Set(printers.map(p => p.location))];

  const stats = [
    {
      label: 'Available Printers',
      value: onlinePrinters.length,
      icon: Printer,
      color: 'text-blue-600',
    },
    {
      label: 'Locations',
      value: locations.length,
      icon: MapPin,
      color: 'text-green-600',
    },
    {
      label: 'Jobs Today',
      value: '127', // This would come from API
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      label: 'Active Users',
      value: '43', // This would come from API
      icon: Users,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="pt-16 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Smart Printing
              <span className="block text-blue-600">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload, print, and collect your documents from any printer in our network. 
              Professional quality printing with real-time tracking and competitive pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to="/printing"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Zap className="h-5 w-5" />
                  <span>Start Printing</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="text-center">
                  <div className={`inline-flex p-3 rounded-full bg-gray-50 mb-4`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Printers Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Printers</h2>
            <p className="text-lg text-gray-600">
              Find a printer near you and start printing instantly
            </p>
          </div>

          {printersLoading ? (
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {onlinePrinters.slice(0, 6).map((printer) => (
                <Card key={printer.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{printer.name}</h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {printer.location}
                      </div>
                    </div>
                    <StatusBadge status={printer.status} />
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">B&W:</span>
                      <span className="font-medium">৳{printer.blackAndWhiteRate}/page</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color:</span>
                      <span className="font-medium">৳{printer.colorRate}/page</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Queue:</span>
                      <span className="font-medium">{printer.queueLength} jobs</span>
                    </div>
                  </div>

                  {isAuthenticated && (
                    <Link
                      to="/printing"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium text-center block"
                    >
                      Print Here
                    </Link>
                  )}
                </Card>
              ))}
            </div>
          )}

          {!printersLoading && onlinePrinters.length > 6 && (
            <div className="text-center mt-8">
              <Link
                to={isAuthenticated ? "/printers" : "/signup"}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Printers
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SmartPrint?</h2>
            <p className="text-lg text-gray-600">
              Professional printing services with modern convenience
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
              <p className="text-gray-600">
                Monitor your print jobs in real-time with instant notifications and status updates.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multiple Locations</h3>
              <p className="text-gray-600">
                Access our network of printers across multiple convenient locations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Processing</h3>
              <p className="text-gray-600">
                Upload and print documents instantly with our fast processing system.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;