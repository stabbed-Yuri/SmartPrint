import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { PrintJob } from '../types';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

// Query keys
export const queryKeys = {
  printers: ['printers'],
  printer: (id: number) => ['printer', id],
  printerStatus: ['printerStatus'],
  userJobs: ['userJobs'],
  printJobs: ['printJobs'],
  users: ['users'],
  currentUser: ['currentUser'],
};

// Printer hooks
export const usePrinters = () => {
  return useQuery({
    queryKey: queryKeys.printers,
    queryFn: apiService.getPrinters,
  });
};

export const usePrinter = (id: number) => {
  return useQuery({
    queryKey: queryKeys.printer(id),
    queryFn: () => apiService.getPrinter(id),
    enabled: !!id,
  });
};

export const usePrinterStatus = () => {
  return useQuery({
    queryKey: queryKeys.printerStatus,
    queryFn: () => apiService.getPrinterStatus(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

export const useDeletePrinter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.deletePrinter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.printers });
      toast.success('Printer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete printer');
    },
  });
};

// User hooks
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: apiService.getUsers,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, userData }: { userId: number; userData: Partial<unknown> }) =>
      apiService.updateUser(userId, userData),
    onMutate: async ({ userId, userData }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users });
      const previousUsers = queryClient.getQueryData<unknown[]>(queryKeys.users);
      if (previousUsers) {
        queryClient.setQueryData(
          queryKeys.users,
          previousUsers.map((user: unknown) =>
            (user as { id: number }).id === userId ? { ...(user as object), ...userData } : user
          )
        );
      }
      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users, context.previousUsers);
      }
      toast.error('Failed to update user');
    },
    onSuccess: () => {
      toast.success('User updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
};

// Print job hooks
export const useUserJobs = () => {
  return useQuery({
    queryKey: queryKeys.userJobs,
    queryFn: apiService.getUserJobs,
  });
};

export const usePrintJobs = () => {
  return useQuery({
    queryKey: queryKeys.printJobs,
    queryFn: apiService.getPrintJobs,
  });
};

export const useSubmitPrintJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.submitPrintJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userJobs });
      toast.success('Print job submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit print job');
    },
  });
};

export const useCalculatePrintCost = () => {
  return useMutation({
    mutationFn: apiService.calculatePrintCost,
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to calculate cost');
    },
  });
};

export const usePollJobStatus = (jobId: number | null, onUpdate: (job: PrintJob) => void) => {
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const updatedJob = await apiService.getPrintJob(jobId);
        onUpdate(updatedJob);

        // Stop polling if the job is completed or failed
        if (updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED' || updatedJob.status === 'CANCELLED') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
        clearInterval(interval); // Stop on error
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [jobId, onUpdate]);
};

// Current user hook
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: apiService.getCurrentUser,
  });
};