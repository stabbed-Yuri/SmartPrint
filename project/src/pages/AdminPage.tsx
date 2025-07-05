import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrinters, useUserJobs } from '../hooks/useApi';
import { 
  Users, 
  Printer, 
  FileText, 
  DollarSign, 
  CheckCircle
} from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AnalyticsCharts from '../components/admin/AnalyticsCharts';
import AdminLayout from '../components/layout/AdminLayout';
import Layout from '../components/layout/Layout';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { data: printers, isLoading: printersLoading } = usePrinters();
  const { data: jobs, isLoading: jobsLoading } = useUserJobs();

  // Debug logging
  React.useEffect(() => {
    console.log('AdminPage: Data received', {
      printers: printers?.length || 0,
      jobs: jobs?.length || 0,
      sampleJob: jobs?.[0],
      samplePrinter: printers?.[0]
    });
  }, [printers, jobs]);

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!jobs || !printers) return null;

    const onlinePrinters = printers.filter(p => p.status === 'ONLINE').length;
    const offlinePrinters = printers.filter(p => p.status === 'OFFLINE').length;
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
    const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'PRINTING').length;
    const failedJobs = jobs.filter(j => j.status === 'FAILED').length;
    
    // Fix: Use totalCost instead of cost
    const totalRevenue = jobs.reduce((sum, job) => sum + (job.totalCost || 0), 0);
    const completedRevenue = jobs
      .filter(j => j.status === 'COMPLETED')
      .reduce((sum, job) => sum + (job.totalCost || 0), 0);

    return {
      onlinePrinters,
      offlinePrinters,
      completedJobs,
      pendingJobs,
      failedJobs,
      totalRevenue,
      completedRevenue,
    };
  }, [jobs, printers]);

  // Redirect if not admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Users',
      value: '156', // This would come from API
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Active Printers',
      value: analytics?.onlinePrinters.toString() || '0',
      icon: Printer,
      color: 'bg-green-500',
      change: '+5%',
    },
    {
      title: 'Total Jobs',
      value: jobs?.length.toString() || '0',
      icon: FileText,
      color: 'bg-purple-500',
      change: '+23%',
    },
    {
      title: 'Total Revenue',
      value: `৳${analytics?.totalRevenue.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+18%',
    },
  ];

  const recentJobs = jobs?.slice(0, 5) || [];
  const recentPrinters = printers?.slice(0, 5) || [];

  if (printersLoading || jobsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">System overview and management tools</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} padding="md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-green-600 font-medium">{stat.change}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Analytics Charts */}
          {analytics && (
            <div className="mb-12">
              <AnalyticsCharts jobs={jobs || []} printers={printers || []} />
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-12">
            {/* System Status */}
            <Card>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">System Status</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 text-lg">System Online</p>
                      <p className="text-sm text-green-600">All services running normally</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{analytics?.onlinePrinters || 0}</div>
                    <div className="text-sm text-gray-600 mt-2">Online Printers</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{analytics?.offlinePrinters || 0}</div>
                    <div className="text-sm text-gray-600 mt-2">Offline Printers</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{analytics?.completedJobs || 0}</div>
                    <div className="text-sm text-gray-600 mt-2">Completed Jobs</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">{analytics?.pendingJobs || 0}</div>
                    <div className="text-sm text-gray-600 mt-2">Pending Jobs</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Recent Jobs</h2>
                <Link to="/admin/jobs" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-6 w-6 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{job.documentName}</p>
                        <p className="text-sm text-gray-600">
                          {job.totalPages || job.pageCount} pages • {job.printerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">৳{(job.totalCost || 0).toFixed(2)}</span>
                      <StatusBadge status={job.status} variant="job" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Printer Status Overview */}
          <Card className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Printer Network</h2>
              <Link to="/admin/printers" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Manage All
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPrinters.map((printer) => (
                <div key={printer.id} className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-lg">{printer.name}</h3>
                    <StatusBadge status={printer.status} />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{printer.location}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Queue:</span>
                    <span className="font-medium">{printer.queueLength} jobs</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default AdminPage; 