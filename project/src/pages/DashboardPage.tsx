import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserJobs, usePrinters } from '../hooks/useApi';
import { 
  Upload, 
  FileText, 
  Printer, 
  DollarSign, 
  Clock, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: jobs, isLoading: jobsLoading } = useUserJobs();
  const { data: printers } = usePrinters();

  const recentJobs = jobs?.slice(0, 5) || [];
  const totalJobs = jobs?.length || 0;
  const completedJobs = jobs?.filter(job => job.status === 'COMPLETED').length || 0;
  const availablePrinters = printers?.filter(p => p.status === 'ONLINE').length || 0;

  const quickActions = [
    {
      title: 'Print Documents',
      description: 'Upload and print your files',
      icon: Upload,
      link: '/printing',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'View Printers',
      description: 'Browse available printers',
      icon: Printer,
      link: '/printers',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Job History',
      description: 'Track your print jobs',
      icon: FileText,
      link: '/jobs',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  const stats = [
    {
      title: 'Account Balance',
      value: `৳${user?.balance?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Total Jobs',
      value: totalJobs.toString(),
      icon: FileText,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Completed',
      value: completedJobs.toString(),
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Available Printers',
      value: availablePrinters.toString(),
      icon: Printer,
      color: 'text-purple-600 bg-purple-100',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your printing today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} padding="md">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.link}
                    className={`${action.color} text-white p-4 rounded-lg block transition-colors group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-6 w-6" />
                        <div>
                          <p className="font-medium">{action.title}</p>
                          <p className="text-sm opacity-90">{action.description}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Print Jobs</h2>
              <Link
                to="/jobs"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All
              </Link>
            </div>

            {jobsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-white p-2 rounded-lg border">
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{job.documentName}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{job.totalPages} pages</span>
                          <span>{job.printType.replace('_', ' & ')}</span>
                          <span>{format(new Date(job.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-gray-900">৳{(job.totalCost || 0).toFixed(2)}</span>
                      <StatusBadge status={job.status} variant="job" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No print jobs yet</p>
                <Link
                  to="/printing"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Printing
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Account Status */}
      {user?.resetPasswordRequired && (
        <Card className="mt-8 border-yellow-200 bg-yellow-50">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-yellow-800">Password Reset Required</p>
              <p className="text-sm text-yellow-700">
                Please update your password for security purposes.
              </p>
            </div>
            <Link
              to="/profile"
              className="ml-auto bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Update Password
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;