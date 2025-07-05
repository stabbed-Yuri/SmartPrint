import React, { useState } from 'react';
import { usePrintJobs } from '../hooks/useApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import { PrintJob } from '../types';
import { format } from 'date-fns';
import Card from '../components/common/Card';
import AdminLayout from '../components/layout/AdminLayout';
import { Search, Filter, FileText } from 'lucide-react';
import Layout from '../components/layout/Layout';

const AdminJobsPage: React.FC = () => {
  const { data: jobs, isLoading, isError } = usePrintJobs();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.printerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = [
    {
      label: 'Total Jobs',
      value: jobs?.length || 0,
      color: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: jobs?.filter(j => j.status === 'COMPLETED').length || 0,
      color: 'text-green-600',
    },
    {
      label: 'Pending',
      value: jobs?.filter(j => j.status === 'PENDING' || j.status === 'PRINTING').length || 0,
      color: 'text-yellow-600',
    },
    {
      label: 'Failed',
      value: jobs?.filter(j => j.status === 'FAILED').length || 0,
      color: 'text-red-600',
    },
  ];

  const totalRevenue = jobs?.reduce((sum, job) => sum + job.totalCost, 0) || 0;

  if (isLoading) {
    return (
      <Layout>
        <AdminLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </AdminLayout>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <AdminLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-4">Error fetching print jobs</div>
              <p className="text-gray-600">Please try refreshing the page or contact support if the problem persists.</p>
            </div>
          </div>
        </AdminLayout>
      </Layout>
    );
  }

  return (
    <Layout>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Print Jobs</h1>
            <p className="text-gray-600">Monitor and manage all print jobs across the system</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} padding="md">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Total Revenue */}
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
                <p className="text-sm text-gray-600">All-time revenue from print jobs</p>
              </div>
              <div className="text-3xl font-bold text-green-600">৳{totalRevenue.toFixed(2)}</div>
            </div>
          </Card>

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs, users, or printers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PRINTING">Printing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredJobs.length} of {jobs?.length || 0} jobs
              </div>
            </div>
          </Card>

          {/* Jobs Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Job ID</th>
                    <th scope="col" className="px-6 py-3">User</th>
                    <th scope="col" className="px-6 py-3">Printer</th>
                    <th scope="col" className="px-6 py-3">Document</th>
                    <th scope="col" className="px-6 py-3">Pages</th>
                    <th scope="col" className="px-6 py-3">Copies</th>
                    <th scope="col" className="px-6 py-3">Cost</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Submitted</th>
                    <th scope="col" className="px-6 py-3">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job: PrintJob) => (
                    <tr key={job.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">#{job.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{job.userName}</td>
                      <td className="px-6 py-4">{job.printerName}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={job.documentName}>
                        {job.documentName}
                      </td>
                      <td className="px-6 py-4">{job.totalPages}</td>
                      <td className="px-6 py-4">{job.copyCount || 1}</td>
                      <td className="px-6 py-4 font-medium text-green-600">৳{job.totalCost.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={job.status} variant="job" />
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {job.createdAt ? format(new Date(job.createdAt), 'MMM d, yyyy h:mm a') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {job.completedAt ? format(new Date(job.completedAt), 'MMM d, yyyy h:mm a') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' ? 'No jobs match your filters' : 'No print jobs found'}
                </p>
              </div>
            )}
          </Card>
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default AdminJobsPage; 