import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../lib/api';
import type { DashboardStats } from '../types';
import { 
  TrendingUp,
  Users,
  Target,
  DollarSign,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  AlertTriangle,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AnalyticsData {
  leadsByStatus: Array<{ status: string; count: number; percentage: number }>;
  leadsBySource: Array<{ source: string; count: number; percentage: number }>;
  recentActivity: Array<{ type: string; description: string; timestamp: string; user: string }>;
  metrics: {
    conversionRate: number;
    averageResponseTime?: number;
    leadsThisWeek: number;
    leadsThisMonth: number;
    leadWon?: number;
  };
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">This feature is only available to administrators.</p>
        <a href="/leads" className="btn btn-primary">Go to Leads</a>
      </div>
    );
  }

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, statusResponse, sourceResponse, activityResponse, metricsResponse] = await Promise.all([
        dashboardApi.getAdminStats(),
        dashboardApi.getLeadsByStatus(),
        dashboardApi.getLeadsBySource(),
        dashboardApi.getRecentActivity(),
        dashboardApi.getLeadMetrics()
      ]);
      
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
      
      setAnalyticsData({
        leadsByStatus: statusResponse.success ? statusResponse.data! : [],
        leadsBySource: sourceResponse.success ? sourceResponse.data! : [],
        recentActivity: activityResponse.success ? activityResponse.data! : [],
        metrics: metricsResponse.success ? metricsResponse.data! : {
          conversionRate: 0,
          averageResponseTime: 0,
          leadsThisWeek: 0,
          leadsThisMonth: 0
        }
      });
      
      // Debug logging for recent activity data
      if (activityResponse.success && activityResponse.data) {
        console.log('Recent Activity Data:', activityResponse.data);
        console.log('Sample timestamp:', activityResponse.data[0]?.timestamp);
      }
      
    } catch (error) {
      console.error('Failed to fetch analytics');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      // Create CSV content
      const csvContent = generateCSVReport();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Analytics report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const generateCSVReport = (): string => {
    const headers = ['Metric', 'Value', 'Percentage'];
    const rows: string[][] = [];
    
    // Add stats data
    if (stats) {
      rows.push(['Total Leads', stats.totalLeads.toString(), '100%']);
      rows.push(['New Leads', stats.newLeads.toString(), ((stats.newLeads / stats.totalLeads) * 100).toFixed(1) + '%']);
      rows.push(['Qualified Leads', stats.qualifiedLeads.toString(), ((stats.qualifiedLeads / stats.totalLeads) * 100).toFixed(1) + '%']);
      rows.push(['Closed Won', stats.closedWon.toString(), ((stats.closedWon / stats.totalLeads) * 100).toFixed(1) + '%']);
      rows.push(['Conversion Rate', stats.conversionRate.toFixed(1) + '%', '']);
    }
    
    // Add analytics data
    if (analyticsData) {
      rows.push(['', '', '']); // Empty row
      rows.push(['LEADS BY STATUS', '', '']);
      analyticsData.leadsByStatus.forEach(item => {
        rows.push([item.status, item.count.toString(), Number(item.percentage).toFixed(1) + '%']);
      });
      
      rows.push(['', '', '']); // Empty row
      rows.push(['LEADS BY SOURCE', '', '']);
      analyticsData.leadsBySource.forEach(item => {
        rows.push([item.source, item.count.toString(), Number(item.percentage).toFixed(1) + '%']);
      });
    }
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const getStatusColor = (index: number): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500'
    ];
    return colors[index % colors.length];
  };

  const getSourceColor = (index: number): string => {
    const colors = [
      'bg-emerald-500', 'bg-cyan-500', 'bg-orange-500', 'bg-rose-500',
      'bg-violet-500', 'bg-amber-500', 'bg-teal-500', 'bg-lime-500'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your lead management performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d' | 'all')}
            className="form-input w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="btn btn-secondary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportReport}
            className="btn btn-primary"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
                <p className="text-xs text-green-600">
                  +{stats.leadsThisMonth} this month
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body flex items-center">
              <div className="flex-shrink-0">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {stats.closedWon} won / {stats.totalLeads} total
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.qualifiedLeads}</p>
                <p className="text-xs text-blue-600">
                  {((stats.qualifiedLeads / stats.totalLeads) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newLeads}</p>
                <p className="text-xs text-orange-600">
                  Require attention
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Status */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Leads by Status</h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <div className="card-body">
            {analyticsData?.leadsByStatus && analyticsData.leadsByStatus.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.leadsByStatus.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${getStatusColor(index)}`}></div>
                      <span className="text-sm font-medium text-gray-900">{item.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(index)}`}
                          style={{ width: `${Number(item.percentage)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8">{item.count}</span>
                      <span className="text-xs text-gray-500 w-10">{Number(item.percentage).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No status data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Leads by Source */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Leads by Source</h3>
            <PieChart className="w-5 h-5 text-gray-500" />
          </div>
          <div className="card-body">
            {analyticsData?.leadsBySource && analyticsData.leadsBySource.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.leadsBySource.map((item, index) => (
                  <div key={item.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${getSourceColor(index)}`}></div>
                      <span className="text-sm font-medium text-gray-900">{item.source}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                        <div 
                          className={`h-2 rounded-full ${getSourceColor(index)}`}
                          style={{ width: `${Number(item.percentage)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8">{item.count}</span>
                      <span className="text-xs text-gray-500 w-10">{Number(item.percentage).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No source data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
          </div>
          <div className="card-body">
            {analyticsData?.metrics ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.metrics.conversionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData?.metrics.leadWon ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Lead Won</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {analyticsData.metrics.leadsThisWeek}
                  </div>
                  <div className="text-sm text-gray-600">Leads This Week</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData.metrics.leadsThisMonth}
                  </div>
                  <div className="text-sm text-gray-600">Leads This Month</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No metrics data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          <div className="card-body">
            {analyticsData?.recentActivity && analyticsData.recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analyticsData.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.user}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            if (!activity.timestamp) return 'Unknown time';
                            const date = new Date(activity.timestamp);
                            if (isNaN(date.getTime())) return 'Invalid date';
                            return date.toLocaleString();
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      {stats?.topPerformers && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Team Performance</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team Member</th>
                    <th>Leads Assigned</th>
                    <th>Leads Converted</th>
                    <th>Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topPerformers.map((performer, index) => (
                    <tr key={performer.userId}>
                      <td>
                        <div className="flex items-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="font-medium">{performer.userName}</td>
                      <td>{performer.leadsAssigned}</td>
                      <td>{performer.leadsConverted}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{performer.conversionRate.toFixed(1)}%</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min(performer.conversionRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;