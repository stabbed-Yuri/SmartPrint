import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'printer' | 'job';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'printer' }) => {
  const getStatusClasses = () => {
    if (variant === 'printer') {
      switch (status.toUpperCase()) {
        case 'ONLINE':
          return 'bg-green-100 text-green-800';
        case 'OFFLINE':
          return 'bg-gray-100 text-gray-800';
        case 'MAINTENANCE':
          return 'bg-yellow-100 text-yellow-800';
        case 'ERROR':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    } else {
      switch (status.toUpperCase()) {
        case 'PENDING':
          return 'bg-yellow-100 text-yellow-800';
        case 'PROCESSING':
          return 'bg-blue-100 text-blue-800';
        case 'COMPLETED':
          return 'bg-green-100 text-green-800';
        case 'FAILED':
          return 'bg-red-100 text-red-800';
        case 'CANCELLED':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;