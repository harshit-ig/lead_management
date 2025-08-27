import { Request, Response } from 'express';
import Lead from '../models/Lead';
import type { DashboardStats } from '../types';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Get user-specific lead statistics
    const stats = await (Lead as any).getLeadStats(userId);

    // Calculate additional metrics
    const averageResponseTime = 0; // TODO: Implement when we have interaction tracking
    const leadsGrowth = 0; // TODO: Implement growth calculation

    const dashboardStats: DashboardStats = {
      ...stats,
      averageResponseTime,
      leadsGrowth,
      topPerformers: [], // Users don't see top performers
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: dashboardStats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const getAdminDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admins can access admin dashboard stats
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    // Get overall lead statistics (no userId filter)
    const leadStats = await (Lead as any).getLeadStats();

    // Get top performers
    const topPerformers = await (Lead as any).getTopPerformers();

    // Calculate growth metrics
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const [thisMonthLeads, lastMonthLeads] = await Promise.all([
      Lead.countDocuments({
        createdAt: { $gte: thisMonth }
      }),
      Lead.countDocuments({
        createdAt: {
          $gte: lastMonth,
          $lt: thisMonth
        }
      })
    ]);

    const leadsGrowth = lastMonthLeads > 0
      ? ((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100
      : thisMonthLeads > 0 ? 100 : 0;

    // Calculate average response time (placeholder)
    const averageResponseTime = 24; // TODO: Implement actual calculation

    const dashboardStats: DashboardStats = {
      ...leadStats,
      averageResponseTime,
      leadsGrowth,
      topPerformers,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Admin dashboard statistics retrieved successfully',
      data: dashboardStats
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard statistics',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const getLeadsByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const baseMatch = req.user?.role === 'admin' ? {} : { assignedTo: req.user?.userId };

    const leadsByStatus = await Lead.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = leadsByStatus.reduce((sum, item) => sum + item.count, 0);

    const result = leadsByStatus.map(item => ({
      status: item._id,
      count: item.count,
      percentage: total > 0 ? (item.count / total) * 100 : 0
    }));

    res.status(200).json({
      success: true,
      message: 'Leads by status retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get leads by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leads by status',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const getLeadsBySource = async (req: Request, res: Response): Promise<void> => {
  try {
    const baseMatch = req.user?.role === 'admin' ? {} : { assignedTo: req.user?.userId };

    const leadsBySource = await Lead.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const total = leadsBySource.reduce((sum, item) => sum + item.count, 0);

    const result = leadsBySource.map(item => ({
      source: item._id,
      count: item.count,
      percentage: total > 0 ? (item.count / total) * 100 : 0
    }));

    res.status(200).json({
      success: true,
      message: 'Leads by source retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get leads by source error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leads by source',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const baseMatch = req.user?.role === 'admin' ? {} : { assignedTo: req.user?.userId };

    const recentLeads = await Lead.find(baseMatch)
      .populate('assignedTo', 'name email')
      .populate('assignedByUser', 'name email')
      .sort({ updatedAt: -1 })
      .limit(limitNum)
      .select('name company status updatedAt assignedTo assignedByUser')
      .lean();

    // Transform lead data into activity format
    const activities = recentLeads.map(lead => ({
      type: 'lead_update',
      description: `Lead "${lead.name}" from ${lead.company} status updated to ${lead.status}`,
      timestamp: lead.updatedAt,
      user: typeof lead.assignedTo === 'object' && lead.assignedTo && 'name' in lead.assignedTo
        ? (lead.assignedTo as any).name
        : 'System'
    }));

    res.status(200).json({
      success: true,
      message: 'Recent activity retrieved successfully',
      data: activities
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent activity',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const getLeadMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = '30d' } = req.query;

    let dateFilter: any = {};
    const now = new Date();

    switch (period) {
      case '7d':
        dateFilter = {
          createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        };
        break;
      case '30d':
        dateFilter = {
          createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        };
        break;
      case '90d':
        dateFilter = {
          createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
        };
        break;
      default:
        // No date filter for 'all'
        break;
    }

    const baseMatch = req.user?.role === 'admin' ? dateFilter : {
      ...dateFilter,
      assignedTo: req.user?.userId
    };

    const metrics = await Lead.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          newLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'New'] }, 1, 0] }
          },
          contactedLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'Contacted'] }, 1, 0] }
          },
          qualifiedLeads: {
            $sum: { $cond: [{ $eq: ['$status', 'Qualified'] }, 1, 0] }
          },
          closedWon: {
            $sum: { $cond: [{ $eq: ['$status', 'Closed-Won'] }, 1, 0] }
          },
          closedLost: {
            $sum: { $cond: [{ $eq: ['$status', 'Closed-Lost'] }, 1, 0] }
          },
          avgLeadScore: { $avg: '$leadScore' }
        }
      }
    ]);

    const result = metrics.length > 0 ? metrics[0] : {
      totalLeads: 0,
      newLeads: 0,
      contactedLeads: 0,
      qualifiedLeads: 0,
      closedWon: 0,
      closedLost: 0,
      avgLeadScore: 0
    };

    // Calculate conversion rate
    result.conversionRate = result.totalLeads > 0
      ? (result.closedWon / result.totalLeads) * 100
      : 0;

    res.status(200).json({
      success: true,
      message: 'Lead metrics retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get lead metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lead metrics',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};
