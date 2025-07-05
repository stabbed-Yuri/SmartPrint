import React, { useState } from 'react';
import { usePrinters, useDeletePrinter } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { Printer, MapPin, Plus, Edit, Trash2, Power, Settings } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface PrinterFormData {
  name: string;
  location: string;
  ipAddress: string;
  blackAndWhiteRate: number;
  colorRate: number;
}

const PrintersPage: React.FC = () => {
  const { user } = useAuth();
  const { data: printers, isLoading } = usePrinters();
  const deletePrinter = useDeletePrinter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PrinterFormData>();

  const userPrinters = printers?.filter(p => p.owner?.id === user?.id) || [];
  const availablePrinters = printers?.filter(p => p.status === 'ONLINE') || [];

  const filteredPrinters = printers?.filter(printer => {
    switch (filter) {
      case 'owned':
        return printer.owner?.id === user?.id;
      case 'available':
        return printer.status === 'ONLINE';
      case 'offline':
        return printer.status === 'OFFLINE';
      default:
        return true;
    }
  }) || [];

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

  const handleDelete = async (printerId: number) => {
    if (window.confirm('Are you sure you want to delete this printer?')) {
      try {
        await deletePrinter.mutateAsync(printerId);
      } catch (error) {
        // Error handling is done in the hook
      }
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
    });
    setShowAddForm(true);
  };

  const stats = [
    {
      label: 'Total Printers',
      value: printers?.length || 0,
      color: 'text-blue-600',
    },
    {
      label: 'Your Printers',
      value: userPrinters.length,
      color: 'text-green-600',
    },
    {
      label: 'Available',
      value: availablePrinters.length,
      color: 'text-purple-600',
    },
    {
      label: 'Offline',
      value: printers?.filter(p => p.status === 'OFFLINE').length || 0,
      color: 'text-red-600',
    },
  ];

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Printers</h1>
          <p className="text-gray-600">Manage and monitor your printing network</p>
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

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'all', label: 'All Printers' },
          { id: 'owned', label: 'My Printers' },
          { id: 'available', label: 'Available' },
          { id: 'offline', label: 'Offline' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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

            {printer.owner?.id === user?.id && (
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
            )}
          </Card>
        ))}
      </div>

      {filteredPrinters.length === 0 && (
        <div className="text-center py-12">
          <Printer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No printers found</p>
          <Button onClick={() => setShowAddForm(true)}>Add Your First Printer</Button>
        </div>
      )}
    </div>
  );
};

export default PrintersPage; 