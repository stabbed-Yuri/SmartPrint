import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrinters, useDeletePrinter } from '../hooks/useApi';
import { Printer, Search, Plus, Edit, Trash2, MapPin, Activity } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminLayout from '../components/layout/AdminLayout';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';

interface PrinterFormData {
  name: string;
  location: string;
  ipAddress: string;
  blackAndWhiteRate: number;
  colorRate: number;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
}

const AdminPrintersPage: React.FC = () => {
  const { user } = useAuth();
  const { data: printers, isLoading } = usePrinters();
  const deletePrinter = useDeletePrinter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrinterFormData>();

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

  const filteredPrinters = printers?.filter(printer => {
    const matchesSearch = printer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         printer.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || printer.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = [
    {
      label: 'Total Printers',
      value: printers?.length || 0,
      color: 'text-blue-600',
    },
    {
      label: 'Online',
      value: printers?.filter(p => p.status === 'ONLINE').length || 0,
      color: 'text-green-600',
    },
    {
      label: 'Offline',
      value: printers?.filter(p => p.status === 'OFFLINE').length || 0,
      color: 'text-red-600',
    },
    {
      label: 'Maintenance',
      value: printers?.filter(p => p.status === 'MAINTENANCE').length || 0,
      color: 'text-yellow-600',
    },
  ];

  const onSubmit = async (data: PrinterFormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(editingPrinter ? 'Printer updated successfully' : 'Printer added successfully');
      reset();
      setShowAddForm(false);
      setEditingPrinter(null);
    } catch (error) {
      toast.error('Failed to save printer');
    }
  };

  const handleEdit = (printer: any) => {
    setEditingPrinter(printer);
    reset({
      name: printer.name,
      location: printer.location,
      ipAddress: printer.ipAddress,
      blackAndWhiteRate: printer.blackAndWhiteRate,
      colorRate: printer.colorRate,
      status: printer.status,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (printerId: number) => {
    if (window.confirm('Are you sure you want to delete this printer?')) {
      try {
        await deletePrinter.mutateAsync(printerId);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const updatePrinterStatus = async (printerId: number, newStatus: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Printer status updated');
    } catch (error) {
      toast.error('Failed to update printer status');
    }
  };

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
    <Layout>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Printer Management</h1>
              <p className="text-gray-600">Monitor and manage all printers in the network</p>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Printer</span>
            </Button>
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

          {/* Add/Edit Printer Form */}
          {showAddForm && (
            <Card className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingPrinter ? 'Edit Printer' : 'Add New Printer'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Printer Name
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('name', { required: 'Printer name is required' })}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.location ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('location', { required: 'Location is required' })}
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IP Address
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.ipAddress ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('ipAddress', { required: 'IP address is required' })}
                    />
                    {errors.ipAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.ipAddress.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.status ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('status', { required: 'Status is required' })}
                    >
                      <option value="ONLINE">Online</option>
                      <option value="OFFLINE">Offline</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="ERROR">Error</option>
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      B&W Rate (৳/page)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.blackAndWhiteRate ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('blackAndWhiteRate', {
                        required: 'B&W rate is required',
                        min: { value: 0, message: 'Rate must be positive' },
                      })}
                    />
                    {errors.blackAndWhiteRate && (
                      <p className="mt-1 text-sm text-red-600">{errors.blackAndWhiteRate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Rate (৳/page)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.colorRate ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('colorRate', {
                        required: 'Color rate is required',
                        min: { value: 0, message: 'Rate must be positive' },
                      })}
                    />
                    {errors.colorRate && (
                      <p className="mt-1 text-sm text-red-600">{errors.colorRate.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingPrinter(null);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPrinter ? 'Update Printer' : 'Add Printer'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search printers..."
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
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredPrinters.length} of {printers?.length || 0} printers
              </div>
            </div>
          </Card>

          {/* Printers Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrinters.map((printer) => (
              <Card key={printer.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Printer className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{printer.name}</h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {printer.location}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={printer.status} />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-medium">{printer.owner?.name || 'Unassigned'}</span>
                  </div>
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IP Address:</span>
                    <span className="font-medium font-mono text-xs">{printer.ipAddress}</span>
                  </div>
                </div>

                {/* Status Control */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Status Change
                  </label>
                  <select
                    value={printer.status}
                    onChange={(e) => updatePrinterStatus(printer.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="ERROR">Error</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(printer)}
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(printer.id)}
                    className="flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredPrinters.length === 0 && (
            <div className="text-center py-12">
              <Printer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No printers found</p>
              <Button onClick={() => setShowAddForm(true)}>Add First Printer</Button>
            </div>
          )}
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default AdminPrintersPage; 