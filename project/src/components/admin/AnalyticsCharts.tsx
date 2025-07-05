import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Card from '../common/Card';
import { PrintJob, Printer } from '../../types';

interface AnalyticsChartsProps {
  jobs: PrintJob[];
  printers: Printer[];
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ jobs, printers }) => {
  // Debug logging
  React.useEffect(() => {
    console.log('AnalyticsCharts: Received data', {
      jobsCount: jobs?.length || 0,
      printersCount: printers?.length || 0,
      sampleJob: jobs?.[0],
      samplePrinter: printers?.[0],
      jobFields: jobs?.[0] ? Object.keys(jobs[0]) : [],
      printerFields: printers?.[0] ? Object.keys(printers[0]) : []
    });
  }, [jobs, printers]);

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!jobs || !printers) {
      console.log('AnalyticsCharts: No data available');
      return null;
    }

    console.log('AnalyticsCharts: Processing data', {
      jobs: jobs.length,
      printers: printers.length
    });

    const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length;
    const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'PRINTING').length;
    const failedJobs = jobs.filter(j => j.status === 'FAILED').length;
    
    console.log('AnalyticsCharts: Job status counts', {
      completed: completedJobs,
      pending: pendingJobs,
      failed: failedJobs
    });

    // Job status distribution for pie chart
    const jobStatusData = [
      { name: 'Completed', value: completedJobs, color: '#10B981' },
      { name: 'Pending', value: pendingJobs, color: '#F59E0B' },
      { name: 'Failed', value: failedJobs, color: '#EF4444' },
    ];

    // Revenue by day (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayJobs = jobs.filter(job => {
        const jobDate = new Date(job.createdAt);
        return jobDate.toDateString() === date.toDateString() && job.status === 'COMPLETED';
      });
      
      const dayRevenue = dayJobs.reduce((sum, job) => sum + (job.totalCost || 0), 0);
      
      return {
        date: dateStr,
        revenue: dayRevenue,
        jobs: jobs.filter(job => {
          const jobDate = new Date(job.createdAt);
          return jobDate.toDateString() === date.toDateString();
        }).length,
      };
    }).reverse();

    console.log('AnalyticsCharts: Last 7 days data', last7Days);

    // Printer performance data
    const printerPerformance = printers.map(printer => {
      const printerJobs = jobs.filter(job => job.printerName === printer.name);
      const completedPrinterJobs = printerJobs.filter(job => job.status === 'COMPLETED');
      const printerRevenue = completedPrinterJobs.reduce((sum, job) => sum + (job.totalCost || 0), 0);
      
      return {
        name: printer.name,
        jobs: printerJobs.length,
        completed: completedPrinterJobs.length,
        revenue: printerRevenue,
        status: printer.status,
      };
    });

    console.log('AnalyticsCharts: Printer performance data', printerPerformance);

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthJobs = jobs.filter(job => {
        const jobDate = new Date(job.createdAt);
        return jobDate.getMonth() === date.getMonth() && 
               jobDate.getFullYear() === date.getFullYear() &&
               job.status === 'COMPLETED';
      });
      
      return {
        month: monthName,
        revenue: monthJobs.reduce((sum, job) => sum + (job.totalCost || 0), 0),
        jobs: monthJobs.length,
      };
    }).reverse();

    console.log('AnalyticsCharts: Monthly revenue data', monthlyRevenue);

    // Print type distribution
    const printTypeData = jobs.reduce((acc, job) => {
      const type = job.printType?.replace('_', ' & ') || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const printTypeChartData = Object.entries(printTypeData).map(([type, count]) => ({
      name: type,
      value: count,
      color: type.includes('COLOR') ? '#8B5CF6' : '#6B7280'
    }));

    console.log('AnalyticsCharts: Print type data', printTypeChartData);

    return {
      jobStatusData,
      last7Days,
      printerPerformance,
      monthlyRevenue,
      printTypeChartData,
    };
  }, [jobs, printers]);

  if (!analytics) {
    console.log('AnalyticsCharts: No analytics data, showing sample data');
    // Show sample data for testing
    const sampleData = {
      jobStatusData: [
        { name: 'Completed', value: 5, color: '#10B981' },
        { name: 'Pending', value: 3, color: '#F59E0B' },
        { name: 'Failed', value: 1, color: '#EF4444' },
      ],
      last7Days: [
        { date: 'Dec 23', revenue: 150, jobs: 8 },
        { date: 'Dec 24', revenue: 200, jobs: 12 },
        { date: 'Dec 25', revenue: 180, jobs: 10 },
        { date: 'Dec 26', revenue: 220, jobs: 15 },
        { date: 'Dec 27', revenue: 190, jobs: 11 },
        { date: 'Dec 28', revenue: 250, jobs: 18 },
        { date: 'Dec 29', revenue: 210, jobs: 14 },
      ],
      printerPerformance: [
        { name: 'Printer 1', jobs: 15, completed: 12, revenue: 180, status: 'ONLINE' },
        { name: 'Printer 2', jobs: 10, completed: 8, revenue: 120, status: 'ONLINE' },
        { name: 'Printer 3', jobs: 8, completed: 6, revenue: 90, status: 'OFFLINE' },
      ],
      monthlyRevenue: [
        { month: 'Jul', revenue: 1200, jobs: 45 },
        { month: 'Aug', revenue: 1400, jobs: 52 },
        { month: 'Sep', revenue: 1100, jobs: 38 },
        { month: 'Oct', revenue: 1600, jobs: 58 },
        { month: 'Nov', revenue: 1800, jobs: 65 },
        { month: 'Dec', revenue: 2000, jobs: 72 },
      ],
      printTypeChartData: [
        { name: 'BLACK & WHITE', value: 25, color: '#6B7280' },
        { name: 'COLOR', value: 15, color: '#8B5CF6' },
      ],
    };
    
    return (
      <div className="space-y-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> Showing sample data for demonstration. Real data will appear when jobs and printers are available.
          </p>
        </div>
        
        {/* Sample Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sampleData.jobStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sampleData.jobStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={sampleData.last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.jobStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.jobStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Printer Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.printerPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="jobs" fill="#8884d8" name="Total Jobs" />
              <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsCharts; 