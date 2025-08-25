import React, { useState, useEffect } from 'react';
import { leadApi } from '../lib/api';
import type { Lead, LeadStatus } from '../types';
import { 
  Phone,
  Mail,
  Building,
  Calendar,
  Edit,
  Plus,
  Search,
  RefreshCw,
  Target,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusOptions: LeadStatus[] = [
    'New', 'Contacted', 'Interested', 'Not Interested', 'Follow-up', 
    'Qualified', 'Proposal Sent', 'Negotiating', 'Closed-Won', 'Closed-Lost'
  ];

  useEffect(() => {
    fetchMyLeads();
  }, [currentPage, statusFilter]);

  const fetchMyLeads = async () => {
    try {
      setLoading(true);
      
      const response = await leadApi.getMyLeads(currentPage, 10);
      
      if (response.success) {
        let filteredLeads = response.data;
        
        // Apply client-side filtering for status and search
        if (statusFilter) {
          filteredLeads = filteredLeads.filter(lead => lead.status === statusFilter);
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredLeads = filteredLeads.filter(lead => 
            lead.name.toLowerCase().includes(query) ||
            lead.email.toLowerCase().includes(query) ||
            lead.company.toLowerCase().includes(query) ||
            lead.phone.toLowerCase().includes(query)
          );
        }
        
        setLeads(filteredLeads);
        setTotalPages(response.pagination.totalPages);
      } else {
        toast.error(response.message || 'Failed to fetch your leads');
      }
    } catch (error) {
      toast.error('Failed to fetch your leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMyLeads();
  };

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const response = await leadApi.updateLead(leadId, { status: newStatus });
      if (response.success) {
        setLeads(prev => prev.map(lead => 
          lead._id === leadId ? { ...lead, status: newStatus } : lead
        ));
        toast.success('Lead status updated successfully');
      } else {
        toast.error(response.message || 'Failed to update lead status');
      }
    } catch (error) {
      toast.error('Failed to update lead status');
    }
  };

  const getStatusColor = (status: LeadStatus): string => {
    const colors: Record<LeadStatus, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800', 
      'Interested': 'bg-green-100 text-green-800',
      'Not Interested': 'bg-red-100 text-red-800',
      'Follow-up': 'bg-orange-100 text-orange-800',
      'Qualified': 'bg-purple-100 text-purple-800',
      'Proposal Sent': 'bg-indigo-100 text-indigo-800',
      'Negotiating': 'bg-pink-100 text-pink-800',
      'Closed-Won': 'bg-emerald-100 text-emerald-800',
      'Closed-Lost': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLeadStats = () => {
    const total = leads.length;
    const newLeads = leads.filter(lead => lead.status === 'New').length;
    const inProgress = leads.filter(lead => 
      ['Contacted', 'Interested', 'Follow-up', 'Qualified', 'Proposal Sent', 'Negotiating'].includes(lead.status)
    ).length;
    const closed = leads.filter(lead => 
      ['Closed-Won', 'Closed-Lost'].includes(lead.status)
    ).length;

    return { total, newLeads, inProgress, closed };
  };

  const stats = getLeadStats();

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
          <h1 className="text-3xl font-bold text-gray-900">My Leads</h1>
          <p className="text-gray-600 mt-2">
            Manage and track your assigned leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMyLeads}
            className="btn btn-secondary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <a href="/leads/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Lead
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Leads</p>
                <p className="text-2xl font-bold text-blue-600">{stats.newLeads}</p>
              </div>
              <Plus className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your leads..."
                className="form-input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')}
              className="form-input w-48"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {leads.map(lead => (
          <div key={lead._id} className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              {/* Lead Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                  <p className="text-sm text-gray-600">{lead.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
              </div>

              {/* Company Info */}
              <div className="flex items-center mb-3">
                <Building className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">{lead.company}</span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <a 
                    href={`mailto:${lead.email}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {lead.email}
                  </a>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <a 
                    href={`tel:${lead.phone}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {lead.phone}
                  </a>
                </div>
              </div>

              {/* Lead Metadata */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(lead.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <span className={`font-medium ${
                    lead.priority === 'High' ? 'text-red-600' :
                    lead.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {lead.priority} Priority
                  </span>
                </div>
              </div>

              {/* Notes Count */}
              {lead.notes && lead.notes.length > 0 && (
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {lead.notes.length} note{lead.notes.length > 1 ? 's' : ''}
                </div>
              )}

              {/* Status Update */}
              <div className="mb-4">
                <label className="form-label">Update Status</label>
                <select
                  value={lead.status}
                  onChange={(e) => updateLeadStatus(lead._id, e.target.value as LeadStatus)}
                  className="form-input"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={`/leads/${lead._id}`}
                  className="btn btn-primary btn-sm flex-1"
                >
                  <Edit className="w-4 h-4" />
                  View Details
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {leads.length === 0 && !loading && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leads assigned</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter
              ? 'No leads match your search criteria'
              : 'You don\'t have any leads assigned yet'
            }
          </p>
          {!searchQuery && !statusFilter && (
            <a href="/leads/new" className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Create Your First Lead
            </a>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card">
          <div className="card-footer">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeads;
