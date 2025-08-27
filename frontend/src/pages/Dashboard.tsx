import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../lib/api';
import type { DashboardStats } from '../types';
import {
  Users,
  UserPlus,
  Phone,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Activity,
  Target,
  Clock,
  AlertCircle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<Array<{ type: string; description: string; timestamp: string; user: string }>>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    if (user?.role !== 'admin') {
      fetchActivity();
    }
  }, []);

  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await dashboardApi.getRecentActivity();
      if (response.success && response.data) {
        setActivity(response.data);
      } else {
        setActivity([]);
      }
    } catch (error) {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = user?.role === 'admin' 
        ? await dashboardApi.getAdminStats()
        : await dashboardApi.getStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard statistics');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatGrowth = (growth: number) => {
    if (growth === 0) return 'No change';
    const sign = growth > 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Define stats cards based on user role
  const getStatsCards = () => {
    if (!stats) return [];

    if (user?.role === 'admin') {
      return [
        {
          title: 'Total Leads',
          value: stats.totalLeads.toLocaleString(),
          icon: Users,
          color: 'from-blue-500 to-blue-600',
          growth: stats.leadsGrowth,
          subtitle: `${stats.newLeads} new this month`
        },
        {
          title: 'Contacted',
          value: stats.contactedLeads.toLocaleString(),
          icon: Phone,
          color: 'from-green-500 to-green-600',
          growth: 0,
          subtitle: `${((stats.contactedLeads / stats.totalLeads) * 100).toFixed(1)}% of total`
        },
        {
          title: 'Qualified',
          value: stats.qualifiedLeads.toLocaleString(),
          icon: Target,
          color: 'from-purple-500 to-purple-600',
          growth: 0,
          subtitle: `${((stats.qualifiedLeads / stats.totalLeads) * 100).toFixed(1)}% qualified`
        },
        {
          title: 'Conversion Rate',
          value: `${stats.conversionRate.toFixed(1)}%`,
          icon: TrendingUp,
          color: 'from-orange-500 to-orange-600',
          growth: 0,
          subtitle: `${stats.closedWon} won / ${stats.totalLeads} total`
        }
      ];
    } else {
      // User view - show only relevant stats
      return [
        {
          title: 'My Leads',
          value: stats.totalLeads.toLocaleString(),
          icon: Users,
          color: 'from-blue-500 to-blue-600',
          growth: 0,
          subtitle: 'Assigned to me'
        },
        {
          title: 'Contacted',
          value: stats.contactedLeads.toLocaleString(),
          icon: Phone,
          color: 'from-green-500 to-green-600',
          growth: 0,
          subtitle: 'Leads contacted'
        },
        {
          title: 'Qualified',
          value: stats.qualifiedLeads.toLocaleString(),
          icon: CheckCircle,
          color: 'from-purple-500 to-purple-600',
          growth: 0,
          subtitle: 'Ready for proposal'
        },
        {
          title: 'Closed Won',
          value: stats.closedWon.toLocaleString(),
          icon: DollarSign,
          color: 'from-emerald-500 to-emerald-600',
          growth: 0,
          subtitle: 'Successfully converted'
        }
      ];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-1" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-900">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchStats}
                className="mt-3 btn btn-primary btn-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-2">
                {user?.role === 'admin' 
                  ? 'Manage your lead pipeline and team performance'
                  : 'Track your leads and update their status'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium">
                  {stats ? new Date(stats.lastUpdated).toLocaleString() : 'Just now'}
                </p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsCards().map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                  {card.growth !== undefined && card.growth !== 0 && (
                    <div className={`text-sm font-medium ${getGrowthColor(card.growth)} flex items-center gap-1`}>
                      <TrendingUp className="w-3 h-3" />
                      <span>{formatGrowth(card.growth)} vs last month</span>
                    </div>
                  )}
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500">Frequently used tasks</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user?.role === 'admin' ? (
              <>
                <a href="/leads/import" className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <UserPlus className="w-4 h-4" />
                  <span>Import Leads</span>
                </a>
                <a href="/leads/assign" className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <Users className="w-4 h-4" />
                  <span>Assign Leads</span>
                </a>
                <a href="/users" className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Users className="w-4 h-4" />
                  <span>Manage Users</span>
                </a>
                <a href="/analytics" className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Activity className="w-4 h-4" />
                  <span>View Analytics</span>
                </a>
              </>
            ) : (
              <>
                <a href="/my-leads" className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Target className="w-4 h-4" />
                  <span>My Leads</span>
                </a>
                <a href="/leads/new" className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <UserPlus className="w-4 h-4" />
                  <span>Add Lead</span>
                </a>
                <a href="/leads" className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Users className="w-4 h-4" />
                  <span>All Leads</span>
                </a>
                <a href="/leads?status=follow-up" className="flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  <Clock className="w-4 h-4" />
                  <span>Follow-ups</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity or Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {user?.role === 'admin' ? 'Team Performance' : 'Recent Activity'}
            </h3>
            <p className="text-sm text-gray-500">
              {user?.role === 'admin' ? 'Top performing team members' : 'Your latest lead interactions'}
            </p>
          </div>
          
          {user?.role === 'admin' && stats?.topPerformers ? (
            <div className="space-y-4">
              {stats.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{performer.userName}</h4>
                      <p className="text-sm text-gray-500">{performer.leadsAssigned} leads assigned</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{performer.conversionRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">{performer.leadsConverted} converted</p>
                  </div>
                </div>
              ))}
            </div>
          ) : user?.role !== 'admin' ? (
            activityLoading ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-spin" />
                <p className="text-gray-500">Loading recent activity...</p>
              </div>
            ) : activity.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {activity.map((item, idx) => (
                  <li key={idx} className="py-4 flex items-start gap-4">
                    <Activity className="w-6 h-6 text-blue-500 mt-1" />
                    <div>
                      <div className="text-sm text-gray-900">{item.description}</div>
                      <div className="text-xs text-gray-500">{item.user} &middot; {new Date(item.timestamp).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity to display</p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
