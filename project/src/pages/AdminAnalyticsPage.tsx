import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePrinters, useUserJobs } from '../hooks/useApi';
import { 
  Users, 
  Printer, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AnalyticsCharts from '../components/admin/AnalyticsCharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AdminLayout from '../components/layout/AdminLayout';
import Layout from '../components/layout/Layout';

const AdminAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: printers = [], isLoading: printersLoading } = usePrinters();
  const { data: jobs = [], isLoading: jobsLoading } = useUserJobs();

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

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!jobs || !printers) return null;

    const onlinePrinters = printers.filter(p => p.status === 'ONLINE').length;
    const offlinePrinters = printers.filter(p => p.status === 'OFFLINE').length;
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
    const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'PRINTING').length;
    const failedJobs = jobs.filter(j => j.status === 'FAILED').length;
    
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

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Manage Printers',
      description: 'Monitor and configure printers',
      icon: Printer,
      link: '/admin/printers',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'View All Jobs',
      description: 'Monitor all print jobs',
      icon: FileText,
      link: '/admin/jobs',
      color: 'bg-purple-500 hover:bg-purple-600',
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Detailed analytics and insights for the SmartPrint system</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
          <div className="mb-8">
            <AnalyticsCharts jobs={jobs || []} printers={printers || []} />
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.link}
                    className={`${action.color} text-white p-6 rounded-lg block transition-colors group`}
                  >
                    <div className="flex items-center space-x-4">
                      <Icon className="h-8 w-8" />
                      <div>
                        <h3 className="font-semibold text-lg">{action.title}</h3>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Jobs */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Jobs</h2>
              <div className="space-y-4">
                {recentJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{job.documentName}</p>
                      <p className="text-sm text-gray-500">
                        User: {job.userName || 'N/A'} - ৳{job.totalCost}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Printer Activity */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Printer Status</h2>
              <div className="space-y-4">
                {recentPrinters.map(printer => (
                  <div key={printer.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{printer.name}</p>
                      <p className="text-sm text-gray-500">{printer.location}</p>
                    </div>
                    <StatusBadge status={printer.status} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default AdminAnalyticsPage; 