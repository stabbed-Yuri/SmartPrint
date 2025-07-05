import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { usePrinters, useSubmitPrintJob, useCalculatePrintCost } from '../hooks/useApi';
import { PrintJob, PrintJobSubmission } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import FileUpload from '../components/common/FileUpload';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Printer, MapPin, DollarSign, FileText, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface PrintFormData {
  printerId: number;
  printType: 'BLACK_AND_WHITE' | 'COLOR';
  pageSize: 'A4' | 'LETTER';
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  deliveryOption: 'PICKUP' | 'DELIVERY';
}

const PrintingPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [costData, setCostData] = useState<{ cost: number; totalPages: number; copyCount: number; costPerCopy: number } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copyCount, setCopyCount] = useState(1);
  const [pollingJob, setPollingJob] = useState<PrintJob | null>(null);

  const { user } = useAuth();
  const { data: printers, isLoading: printersLoading, refetch: refetchPrinters } = usePrinters();
  const submitPrintJob = useSubmitPrintJob();
  const calculateCost = useCalculatePrintCost();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<PrintFormData>({
    defaultValues: {
      printType: 'BLACK_AND_WHITE',
      pageSize: 'A4',
      orientation: 'PORTRAIT',
      deliveryOption: 'PICKUP',
    },
  });

  const watchedValues = watch();
  const onlinePrinters = printers?.filter(p => p.status === 'ONLINE') || [];
  const selectedPrinter = onlinePrinters?.find(p => p.id === Number(watchedValues.printerId));

  // Quick copy count options
  const quickCopyCounts = [1, 2, 3, 5, 10];

  // Calculate cost when form values, files, or copy count change
  useEffect(() => {
    const calculatePrintCost = async () => {
      if (files.length > 0 && watchedValues.printerId) {
        setIsCalculating(true);
        try {
          const result = await calculateCost.mutateAsync({
            ...watchedValues,
            printerId: Number(watchedValues.printerId),
            files,
            copyCount,
          });
          setCostData(result);
        } catch (error) {
          setCostData(null);
        } finally {
          setIsCalculating(false);
        }
      } else {
        setCostData(null);
      }
    };

    const debounceTimer = setTimeout(calculatePrintCost, 500);
    return () => clearTimeout(debounceTimer);
  }, [files, watchedValues.printerId, watchedValues.printType, watchedValues.pageSize, watchedValues.orientation, watchedValues.deliveryOption, copyCount]);

  // Poll for job status
  useEffect(() => {
    if (!pollingJob || pollingJob.status === 'COMPLETED' || pollingJob.status === 'FAILED' || pollingJob.status === 'CANCELLED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await api.get<PrintJob>(`/print/jobs/${pollingJob.id}`);
        const updatedJob = response.data;
        setPollingJob(updatedJob);
        
        if (updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED' || updatedJob.status === 'CANCELLED') {
          toast.success(`Job "${updatedJob.documentName}" is ${updatedJob.status.toLowerCase()}.`);
          refetchPrinters(); // Refresh printer queue info
          setPollingJob(null); // Stop polling
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
        toast.error('Could not get job status update.');
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [pollingJob, refetchPrinters]);

  const onSubmit = async (data: PrintFormData) => {
    if (files.length === 0) {
      toast.error('Please select at least one file to print');
      return;
    }

    if (!data.printerId) {
      toast.error('Please select a printer');
      return;
    }

    // Check if user has sufficient balance
    if (!costData) {
      toast.error('Please wait for cost calculation to complete');
      return;
    }

    if (user && user.balance < costData.cost) {
      toast.error(`Insufficient balance. Required: ৳${costData.cost.toFixed(2)}, Available: ৳${user.balance.toFixed(2)}`);
      return;
    }

    try {
      const newJob = await submitPrintJob.mutateAsync({
        ...data,
        printerId: Number(data.printerId),
        files,
        copyCount,
      });

      // Reset form and files
      reset();
      setFiles([]);
      setCostData(null);
      setCopyCount(1);
      
      // Show success message and start polling
      toast.success('Print job submitted! Now printing...');
      setPollingJob(newJob);
      refetchPrinters();

    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (printersLoading) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Print Documents</h1>
        <p className="text-gray-600">
          Upload your files and configure print settings
        </p>
      </div>

      {pollingJob && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-blue-800">Printing in Progress</h3>
              <p className="text-blue-700 mt-1">
                Document: <span className="font-medium">{pollingJob.documentName}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-800 font-semibold">{pollingJob.status}...</span>
              <LoadingSpinner />
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Print Configuration */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h2>
              <FileUpload files={files} onFilesChange={setFiles} />
            </Card>

            {/* Printer Selection */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Printer</h2>
              {onlinePrinters.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {onlinePrinters.map((printer) => (
                    <label
                      key={printer.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        Number(watchedValues.printerId) === printer.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={printer.id}
                        className="sr-only"
                        {...register('printerId', { required: 'Please select a printer' })}
                      />
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{printer.name}</h3>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {printer.location}
                          </div>
                        </div>
                        <StatusBadge status={printer.status} />
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">B&W:</span>
                          <span className="font-medium">৳{printer.blackAndWhiteRate}/page</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium">৳{printer.colorRate}/page</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Queue:</span>
                          <span className="font-medium">{printer.queueLength} jobs</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No online printers available at the moment.</p>
              )}
              {errors.printerId && (
                <p className="mt-2 text-sm text-red-600">{errors.printerId.message}</p>
              )}
            </Card>

            {/* Print Settings */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Print Settings</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Print Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('printType')}
                  >
                    <option value="BLACK_AND_WHITE">Black & White</option>
                    <option value="COLOR">Color</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Size
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('pageSize')}
                  >
                    <option value="A4">A4</option>
                    <option value="LETTER">Letter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orientation
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('orientation')}
                  >
                    <option value="PORTRAIT">Portrait</option>
                    <option value="LANDSCAPE">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Option
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('deliveryOption')}
                  >
                    <option value="PICKUP">Pickup</option>
                    <option value="DELIVERY">Delivery</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Copy Count Selection */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Number of Copies</h2>
              <div className="space-y-4">
                {/* Quick Copy Count Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quick Selection
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {quickCopyCounts.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setCopyCount(count)}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          copyCount === count
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold">{count}</div>
                        <div className="text-xs text-gray-500">copies</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Copy Count Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Number of Copies
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setCopyCount(Math.max(1, copyCount - 1))}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={copyCount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1 && value <= 100) {
                          setCopyCount(value);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCopyCount(Math.min(100, copyCount + 1))}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum 100 copies per job
                  </p>
                </div>
              </div>
            </Card>

            <Button
              type="submit"
              className="w-full"
              loading={submitPrintJob.isPending}
              disabled={
                files.length === 0 || 
                !watchedValues.printerId || 
                submitPrintJob.isPending ||
                !costData ||
                (user ? user.balance < costData.cost : false)
              }
            >
              Submit Print Job
            </Button>
          </form>
        </div>

        {/* Cost Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            {files.length > 0 && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                
                {selectedPrinter && (
                  <div className="flex items-center space-x-2">
                    <Printer className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{selectedPrinter.name}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Copy className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">{copyCount} cop{copyCount === 1 ? 'y' : 'ies'}</span>
                </div>

                <div className="text-sm text-gray-600">
                  <p>Print Type: {watchedValues.printType?.replace('_', ' & ')}</p>
                  <p>Page Size: {watchedValues.pageSize}</p>
                  <p>Orientation: {watchedValues.orientation}</p>
                  <p>Delivery: {watchedValues.deliveryOption}</p>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              {isCalculating ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span className="text-sm text-gray-600">Calculating cost...</span>
                </div>
              ) : costData ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Pages:</span>
                    <span className="font-medium">{costData.totalPages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Copies:</span>
                    <span className="font-medium">{costData.copyCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cost per copy:</span>
                    <span className="font-medium">৳{costData.costPerCopy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total Cost:</span>
                    <span className="text-green-600">৳{costData.cost.toFixed(2)}</span>
                  </div>
                  
                  {/* Balance Check */}
                  {user && (
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Your Balance:</span>
                        <span className="font-medium">৳{user.balance.toFixed(2)}</span>
                      </div>
                      {user.balance >= costData.cost ? (
                        <div className="flex items-center mt-1 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-xs">Sufficient balance</span>
                        </div>
                      ) : (
                        <div className="flex items-center mt-1 text-red-600">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-xs">Insufficient balance</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Select files and printer to see cost estimate
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrintingPage;