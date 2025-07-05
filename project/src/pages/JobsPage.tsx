import React, { useState } from 'react';
import { useUserJobs } from '../hooks/useApi';
import { FileText, Download, Eye, Filter, Search, Calendar, Copy } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';

const JobsPage: React.FC = () => {
  const { data: jobs, isLoading } = useUserJobs();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.documentName.toLowerCase().includes(searchTerm.toLowerCase());
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

  const totalSpent = jobs?.reduce((sum, job) => sum + job.totalCost, 0) || 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Print Jobs</h1>
        <p className="text-gray-600">Track and manage your printing history</p>
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

      {/* Total Spent */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Total Spent on Printing</h3>
            <p className="text-sm text-gray-600">All-time printing costs</p>
          </div>
          <div className="text-3xl font-bold text-blue-600">৳{totalSpent.toFixed(2)}</div>
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
                placeholder="Search jobs..."
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

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{job.documentName}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>{job.totalPages} pages</span>
                    <span>{job.printType.replace('_', ' & ')}</span>
                    <span>{job.printerName}</span>
                    <div className="flex items-center space-x-1">
                      <Copy className="h-3 w-3" />
                      <span>{job.copyCount || 1} cop{(job.copyCount || 1) === 1 ? 'y' : 'ies'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(job.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    {job.completedAt && (
                      <span className="text-green-600">
                        • Completed {format(new Date(job.completedAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-900">৳{job.totalCost.toFixed(2)}</div>
                  <StatusBadge status={job.status} variant="job" />
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedJob(job)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Button>
                  {job.status === 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex items-center space-x-1"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' ? 'No jobs match your filters' : 'No print jobs yet'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => window.location.href = '/printing'}>
              Start Printing
            </Button>
          )}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Document Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedJob.documentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Pages:</span>
                        <span className="font-medium">{selectedJob.totalPages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Copies:</span>
                        <span className="font-medium">{selectedJob.copyCount || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Print Type:</span>
                        <span className="font-medium">{selectedJob.printType.replace('_', ' & ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Page Size:</span>
                        <span className="font-medium">{selectedJob.pageSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Orientation:</span>
                        <span className="font-medium">{selectedJob.orientation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery:</span>
                        <span className="font-medium">{selectedJob.deliveryOption}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Printer Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Printer:</span>
                        <span className="font-medium">{selectedJob.printerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <StatusBadge status={selectedJob.status} variant="job" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Cost:</span>
                        <span className="font-medium text-green-600">৳{selectedJob.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span className="font-medium">
                        {format(new Date(selectedJob.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {selectedJob.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium text-green-600">
                          {format(new Date(selectedJob.completedAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="secondary" onClick={() => setSelectedJob(null)}>
                    Close
                  </Button>
                  {selectedJob.status === 'COMPLETED' && (
                    <Button className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage; 