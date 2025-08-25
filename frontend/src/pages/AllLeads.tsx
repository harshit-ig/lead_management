import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leadApi } from '../lib/api';
import type { Lead, LeadStatus, LeadSource, LeadPriority, LeadFilters } from '../types';
import { 
  Search, 
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Phone,
  Mail,
  Building,
  Calendar,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const AllLeads: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<LeadFilters>({
    status: [],
    source: [],
    priority: [],
    assignedTo: []
  });

  const statusOptions: LeadStatus[] = [
    'New', 'Contacted', 'Interested', 'Not Interested', 'Follow-up', 
    'Qualified', 'Proposal Sent', 'Negotiating', 'Closed-Won', 'Closed-Lost'
  ];

  const sourceOptions: LeadSource[] = [
    'Website', 'Social Media', 'Referral', 'Import', 'Manual', 'Cold Call', 'Email Campaign'
  ];

  const priorityOptions: LeadPriority[] = ['High', 'Medium', 'Low'];

  useEffect(() => {
    fetchLeads();
  }, [currentPage, filters, searchQuery]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const searchFilters = searchQuery ? { ...filters, search: searchQuery } : filters;
      const response = await leadApi.getLeads(searchFilters, currentPage, 10);
      
      if (response.success) {
        setLeads(response.data);
        setTotalPages(response.pagination.totalPages);
      } else {
        toast.error(response.message || 'Failed to fetch leads');
      }
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLeads();
  };

  const handleFilterChange = (filterType: keyof LeadFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: Array.isArray(prev[filterType]) 
        ? (prev[filterType] as any[]).includes(value)
          ? (prev[filterType] as any[]).filter(item => item !== value)
          : [...(prev[filterType] as any[]), value]
        : [value]
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: [], source: [], priority: [], assignedTo: [] });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    setSelectedLeads(
      selectedLeads.length === leads.length 
        ? [] 
        : leads.map(lead => lead._id)
    );
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

  const getPriorityColor = (priority: LeadPriority): string => {
    const colors: Record<LeadPriority, string> = {
      'High': 'text-red-600',
      'Medium': 'text-yellow-600',
      'Low': 'text-green-600'
    };
    return colors[priority];
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
          <h1 className="text-3xl font-bold text-gray-900">All Leads</h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'admin' 
              ? 'Manage all leads in your system' 
              : 'View and manage your assigned leads'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <a href="/leads/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Lead
          </a>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search leads by name, email, company..."
                className="form-input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                clearFilters();
                fetchLeads();
              }}
              className="btn btn-secondary"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="form-label">Status</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {statusOptions.map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(status)}
                        onChange={() => handleFilterChange('status', status)}
                        className="mr-2"
                      />
                      <span className="text-sm">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Source Filter */}
              <div>
                <label className="form-label">Source</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {sourceOptions.map(source => (
                    <label key={source} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.source?.includes(source)}
                        onChange={() => handleFilterChange('source', source)}
                        className="mr-2"
                      />
                      <span className="text-sm">{source}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="form-label">Priority</label>
                <div className="space-y-2">
                  {priorityOptions.map(priority => (
                    <label key={priority} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.priority?.includes(priority)}
                        onChange={() => handleFilterChange('priority', priority)}
                        className="mr-2"
                      />
                      <span className="text-sm">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={clearFilters}
                  className="btn btn-secondary btn-sm mb-2"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="btn btn-primary btn-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && user?.role === 'admin' && (
        <div className="card border-l-4 border-l-blue-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <a href="/leads/assign" className="btn btn-primary btn-sm">
                  <UserPlus className="w-4 h-4" />
                  Assign Leads
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Lead Details</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Source</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead._id)}
                      onChange={() => handleSelectLead(lead._id)}
                    />
                  </td>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.position}</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-gray-400 mr-2" />
                      {lead.company}
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-3 h-3 text-gray-400 mr-1" />
                        {lead.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-3 h-3 text-gray-400 mr-1" />
                        {lead.phone}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>
                    <span className={`font-medium ${getPriorityColor(lead.priority)}`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-600">{lead.source}</span>
                  </td>
                  <td>
                    {lead.assignedToUser ? (
                      <div className="text-sm">
                        <div className="font-medium">{lead.assignedToUser.name}</div>
                        <div className="text-gray-500">{lead.assignedToUser.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/leads/${lead._id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={`/leads/${lead._id}/edit`}
                        className="text-green-600 hover:text-green-800"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </a>
                      {user?.role === 'admin' && (
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {leads.length === 0 && !loading && (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || Object.values(filters).some(f => f && f.length > 0)
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first lead'
              }
            </p>
            <a href="/leads/new" className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Add Lead
            </a>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
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
        )}
      </div>
    </div>
  );
};

export default AllLeads;
