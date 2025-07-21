import React, { useState, useEffect } from 'react';
import { ActivitiesApi } from './services/ApiService';

const ActivityDashboard = ({ environment = 'development' }) => {
  // State variables
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter states
  const [filters, setFilters] = useState({
    method: '',
    status: '',
    period: '30',
    startDate: '',
    endDate: ''
  });
  
  // Chart data
  const [chartData, setChartData] = useState({
    byMethod: [],
    byStatus: [],
    byAction: []
  });
  
  // Get current session ID
  const sessionId = sessionStorage.getItem('bankingSessionId');
  
  // Load activities on component mount and when filters change
  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [currentPage, pageSize, filters.method, filters.status, filters.period, filters.startDate, filters.endDate]);
  
  // Fetch activities with pagination and filters
  const fetchActivities = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Prepare filter parameters
      const filterParams = {
        sessionId,
        environment,
        method: filters.method || undefined,
        status: filters.status || undefined,
        page: currentPage,
        limit: pageSize
      };
      
      // Add date filters if provided
      if (filters.startDate) filterParams.startDate = filters.startDate;
      if (filters.endDate) filterParams.endDate = filters.endDate;
      
      // Fetch activities
      const result = await ActivitiesApi.getActivities(filterParams);
      
      if (result && result.activities) {
        setActivities(result.activities);
        setTotalPages(result.pagination.totalPages);
      } else if (Array.isArray(result)) {
        setActivities(result);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Failed to fetch activity data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch activity statistics
  const fetchStats = async () => {
    if (!sessionId) return;
    
    try {
      // Prepare filter parameters
      const filterParams = {
        sessionId,
        environment,
        method: filters.method || undefined,
        period: filters.period || undefined
      };
      
      // Fetch statistics
      const stats = await ActivitiesApi.getStats(filterParams);
      
      if (stats) {
        setStats(stats);
        
        // Prepare chart data
        setChartData({
          byMethod: stats.byMethod || [],
          byStatus: [
            { status: 'Success', count: stats.byStatus?.success || 0 },
            { status: 'Failure', count: stats.byStatus?.failure || 0 },
            { status: 'Pending', count: stats.byStatus?.pending || 0 }
          ],
          byAction: stats.byAction || []
        });
      }
    } catch (error) {
      console.error('Error fetching activity statistics:', error);
      // Don't show error for stats, just log it
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Handle period selection
  const handlePeriodChange = (e) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, period: value }));
    
    // Clear custom date range when selecting a predefined period
    if (value !== 'custom') {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    }
  };
  
  // Handle page navigation
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Delete old activities
  const handleDeleteOldActivities = async () => {
    if (!sessionId) return;
    
    if (window.confirm(`Are you sure you want to delete activities older than ${filters.period} days?`)) {
      setIsLoading(true);
      
      try {
        const result = await ActivitiesApi.deleteActivities(filters.period);
        alert(`${result.deletedCount} activities deleted successfully.`);
        fetchActivities();
        fetchStats();
      } catch (error) {
        console.error('Error deleting activities:', error);
        setError('Failed to delete activities. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Render activity status with appropriate color
  const renderStatus = (status) => {
    let statusClass = '';
    
    switch (status) {
      case 'success':
        statusClass = 'bg-green-100 text-green-800';
        break;
      case 'failure':
        statusClass = 'bg-red-100 text-red-800';
        break;
      case 'pending':
        statusClass = 'bg-yellow-100 text-yellow-800';
        break;
      default:
        statusClass = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  // Render simple horizontal bar chart
  const renderBarChart = (data, keyField, valueField, title) => {
    if (!data || data.length === 0) return null;
    
    // Find maximum value for scaling
    const maxValue = Math.max(...data.map(item => item[valueField]));
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="mt-2 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 text-xs text-gray-600">{item[keyField]}</div>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${(item[valueField] / maxValue) * 100}%` }}
                ></div>
              </div>
              <div className="w-8 text-xs text-gray-600 ml-2 text-right">{item[valueField]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render statistics cards
  const renderStatsCards = () => {
    if (!stats) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-700">Total Activities</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total || 0}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-700">Success Rate</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats.total ? Math.round((stats.byStatus?.success || 0) / stats.total * 100) : 0}%
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-700">Failure Rate</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {stats.total ? Math.round((stats.byStatus?.failure || 0) / stats.total * 100) : 0}%
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">Banking Activity Dashboard</h2>
      
      {/* Environment indicator */}
      <div className={`mb-4 p-2 rounded text-sm ${environment === 'development' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
        <p>
          <span className="font-semibold">Mode:</span> {environment === 'development' ? 'Development' : 'Production'}
        </p>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
              Banking Method
            </label>
            <select
              id="method"
              name="method"
              value={filters.method}
              onChange={handleFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              <option value="upi">UPI</option>
              <option value="account">Bank Account</option>
              <option value="card">Credit/Debit Card</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
              Time Period
            </label>
            <select
              id="period"
              name="period"
              value={filters.period}
              onChange={handlePeriodChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {filters.period === 'custom' && (
            <>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleDeleteOldActivities}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            Delete Old Activities
          </button>
        </div>
      </div>
      
      {/* Statistics */}
      {renderStatsCards()}
      
      {/* Charts */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-medium mb-4">Activity Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {renderBarChart(chartData.byMethod, 'method', 'count', 'Activities by Method')}
            {renderBarChart(chartData.byAction, 'action', 'count', 'Activities by Action Type')}
          </div>
          <div>
            {renderBarChart(chartData.byStatus, 'status', 'count', 'Activities by Status')}
          </div>
        </div>
      </div>
      
      {/* Activity List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-lg font-medium p-4 border-b">Activity History</h3>
        
        {error && (
          <div className="p-4 bg-red-100 text-red-700">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No activities found for the selected filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identifier
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(activity.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {activity.action.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.method.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.maskedIdentifier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatus(activity.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{activities.length}</span> results
                    {totalPages > 1 && (
                      <> - Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span></>
                    )}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">First</span>
                      <span>First</span>
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <span>Prev</span>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          } text-sm font-medium`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <span>Next</span>
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Last</span>
                      <span>Last</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityDashboard; 