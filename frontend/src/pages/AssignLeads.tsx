import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leadApi, userApi } from '../lib/api';
import type { Lead, User, LeadStatus, LeadSource } from '../types';
import { 
  UserPlus,
  Search,
  ArrowLeft,
  Users,
  Building,
  Mail,
  Phone,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AssignLeads: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | ''>('');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const leadsPerPage = 10;

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
    fetchData();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [currentPage , showUnassignedOnly]);

  const fetchData = async () => {
    await Promise.all([fetchLeads(), fetchUsers()]);
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (statusFilter) filters.status = [statusFilter];
      if (sourceFilter) filters.source = [sourceFilter];
      if (searchQuery) filters.search = searchQuery;
      if (showUnassignedOnly) filters.assignedTo = [null];

      const response = await leadApi.getLeads(filters, currentPage, leadsPerPage);
      
      if (response.success) {
        setLeads(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalLeads(response.pagination.total);
        }
      } else {
        toast.error('Failed to fetch leads');
      }
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userApi.getUsers();
      if (response.success && response.data) {
        // Show all active users (both admin and user roles) for assignment
        const activeUsers = response.data.filter(u => u.isActive);
        setUsers(activeUsers);
      }
    } catch (error) {
      console.error('Failed to fetch users');
    }
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedLeads([]); // Clear selection when changing pages
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
    setSelectedLeads([]); // Clear selection when filters change
  };

  const handleAssignLeads = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select leads to assign');
      return;
    }

    if (!selectedUser) {
      toast.error('Please select a user to assign leads to');
      return;
    }

    setAssigning(true);

    try {
      const response = await leadApi.assignLeads({
        leadIds: selectedLeads,
        assignToUserId: selectedUser
      });

      if (response.success) {
        toast.success(`Successfully assigned ${selectedLeads.length} leads`);
        setSelectedLeads([]);
        setSelectedUser('');
        fetchLeads(); // Refresh the leads list
      } else {
        toast.error(response.message || 'Failed to assign leads');
      }
    } catch (error) {
      toast.error('Failed to assign leads');
    } finally {
      setAssigning(false);
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
      <div className="flex items-center gap-4">
        <a href="/leads" className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </a>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assign Leads</h1>
          <p className="text-gray-600 mt-2">
            Assign leads to team members for follow-up
            {totalLeads > 0 && (
              <span className="ml-2 text-sm">
                ({totalLeads} total leads{totalPages > 1 ? `, page ${currentPage} of ${totalPages}` : ''})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Assignment Panel */}
      <div className="card border-l-4 border-l-blue-500">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Bulk Assignment
                </h3>
                <p className="text-gray-600">
                  {selectedLeads.length > 0 
                    ? `${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} selected`
                    : 'Select leads below to assign them'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="form-label">Assign to User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="form-input"
                disabled={assigning}
              >
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role}) - {user.email}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAssignLeads}
              disabled={selectedLeads.length === 0 || !selectedUser || assigning}
              className="btn btn-primary"
            >
              {assigning ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Assign {selectedLeads.length > 0 ? selectedLeads.length : ''} Lead{selectedLeads.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={(e) => {
            e.preventDefault();
            fetchLeads();
          }} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  className="form-input pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')}
                className="form-input w-full"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Qualified">Qualified</option>
              </select>
            </div>

            <div>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as LeadSource | '')}
                className="form-input w-full"
              >
                <option value="">All Sources</option>
                <option value="Website">Website</option>
                <option value="Social Media">Social Media</option>
                <option value="Referral">Referral</option>
                <option value="Import">Import</option>
                <option value="Cold Call">Cold Call</option>
              </select>
            </div>

            <div className="flex items-center justify-center">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-md transition-colors">
                <input
                  type="checkbox"
                  checked={showUnassignedOnly}
                  onChange={(e) => setShowUnassignedOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">Unassigned only</span>
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary w-full"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Leads Available for Assignment</h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onChange={handleSelectAll}
                  className="mr-2"
                />
                Select All ({leads.length})
              </label>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="whitespace-nowrap">Lead Details</th>
                <th className="whitespace-nowrap">Contact Info</th>
                <th className="whitespace-nowrap">Company</th>
                <th className="whitespace-nowrap">Status</th>
                <th className="whitespace-nowrap">Source</th>
                <th className="whitespace-nowrap">Priority</th>
                <th className="whitespace-nowrap">Current Assignment</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead._id} className={selectedLeads.includes(lead._id) ? 'bg-blue-50' : ''}>
                  <td className="whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead._id)}
                      onChange={() => handleSelectLead(lead._id)}
                    />
                  </td>
                  <td className="whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.position}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-3 h-3 text-gray-400 mr-1" />
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-800">
                          {lead.email}
                        </a>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="w-3 h-3 text-gray-400 mr-1" />
                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:text-blue-800">
                          {lead.phone}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-gray-400 mr-2" />
                      {lead.company}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`badge ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="text-sm text-gray-600">{lead.source}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`font-medium ${
                      lead.priority === 'High' ? 'text-red-600' :
                      lead.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    {lead.assignedToUser ? (
                      <div className="text-sm">
                        <div className="font-medium">{lead.assignedToUser.name}</div>
                        <div className="text-gray-500">{lead.assignedToUser.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * leadsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * leadsPerPage, totalLeads)}
              </span>{' '}
              of <span className="font-medium">{totalLeads}</span> leads
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-sm btn-outline"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and 2 pages around current
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  );
                })
                .map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`btn btn-sm ${
                      currentPage === page ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-sm btn-outline"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {leads.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-500 mb-4">
              {showUnassignedOnly 
                ? 'All leads are currently assigned'
                : 'No leads match your filter criteria'
              }
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setSourceFilter('');
                  setShowUnassignedOnly(false);
                  handleFilterChange();
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
              <a href="/leads" className="btn btn-primary">
                View All Leads
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Tips */}
      <div className="card border-l-4 border-l-orange-500">
        <div className="card-body">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">Assignment Tips</h3>
              <div className="mt-2 text-sm text-orange-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Consider lead priority and user workload when assigning</li>
                  <li>Match lead characteristics with user expertise</li>
                  <li>Use filters to find specific types of leads for assignment</li>
                  <li>Assigned users will receive notifications about their new leads</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignLeads;
