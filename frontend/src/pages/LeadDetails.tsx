import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leadApi } from '../lib/api';
import type { Lead, LeadStatus, LeadSource, LeadPriority } from '../types';
import { 
  ArrowLeft,
  Edit,
  Save,
  X,
  Plus,
  MessageSquare,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Target,
  Star,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Form data for editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    location: '',
    status: 'New' as LeadStatus,
    priority: 'Medium' as LeadPriority,
    source: 'Manual' as LeadSource
  });

  const statusOptions: LeadStatus[] = [
    'New', 'Contacted', 'Interested', 'Not Interested', 'Follow-up', 
    'Qualified', 'Proposal Sent', 'Negotiating', 'Closed-Won', 'Closed-Lost'
  ];

  const priorityOptions: LeadPriority[] = ['High', 'Medium', 'Low'];

  const sourceOptions: LeadSource[] = [
    'Website', 'Social Media', 'Referral', 'Import', 'Manual', 'Cold Call', 'Email Campaign'
  ];

  useEffect(() => {
    if (id) {
      fetchLead();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await leadApi.getLead(id!);
      
      if (response.success && response.data) {
        setLead(response.data);
        setFormData({
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          company: response.data.company,
          position: response.data.position,
          location: response.data.location,
          status: response.data.status,
          priority: response.data.priority,
          source: response.data.source
        });
      } else {
        toast.error(response.message || 'Failed to fetch lead details');
        navigate('/leads');
      }
    } catch (error) {
      toast.error('Failed to fetch lead details');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await leadApi.updateLead(id!, formData);
      
      if (response.success && response.data) {
        setLead(response.data);
        setIsEditing(false);
        toast.success('Lead updated successfully');
      } else {
        toast.error(response.message || 'Failed to update lead');
      }
    } catch (error) {
      toast.error('Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      setAddingNote(true);
      const response = await leadApi.addNote({
        leadId: id!,
        content: newNote.trim()
      });
      
      if (response.success && response.data) {
        setLead(response.data);
        setNewNote('');
        toast.success('Note added successfully');
      } else {
        toast.error(response.message || 'Failed to add note');
      }
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
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

  const getPriorityColor = (priority: LeadPriority): string => {
    const colors: Record<LeadPriority, string> = {
      'High': 'text-red-600',
      'Medium': 'text-yellow-600',
      'Low': 'text-green-600'
    };
    return colors[priority];
  };

  const getPriorityIcon = (priority: LeadPriority) => {
    if (priority === 'High') return <AlertCircle className="w-4 h-4" />;
    if (priority === 'Medium') return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Lead not found</h3>
        <p className="text-gray-500 mb-4">The lead you're looking for doesn't exist or you don't have access to it.</p>
        <button onClick={() => navigate('/leads')} className="btn btn-primary">
          Go back to leads
        </button>
      </div>
    );
  }

  // Check if user can edit (admin or assigned user)
  const canEdit = user?.role === 'admin' || lead.assignedTo === user?._id;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/leads')}
            className="btn btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-gray-600 mt-1">{lead.position} at {lead.company}</p>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
              >
                <Edit className="w-4 h-4" />
                Edit Lead
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Lead Information</h3>
            </div>
            <div className="card-body">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Position</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., UK, USA, Germany"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Source</label>
                    <select
                      className="form-input"
                      value={formData.source}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as LeadSource }))}
                    >
                      {sourceOptions.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p className="text-gray-900">{lead.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-800">
                          {lead.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:text-blue-800">
                          {lead.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Company</p>
                        <p className="text-gray-900">{lead.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Position</p>
                        <p className="text-gray-900">{lead.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Location</p>
                        <p className="text-gray-900">{lead.location || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Source</p>
                        <p className="text-gray-900">{lead.source}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Notes & Interactions</h3>
                {canEdit && (
                  <span className="text-sm text-gray-500">
                    {lead.notes?.length || 0} note{(lead.notes?.length || 0) !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="card-body">
              {/* Add Note Form */}
              {canEdit && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        placeholder="Add a note about your interaction with this lead..."
                        className="form-input resize-none"
                        rows={3}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={handleAddNote}
                          disabled={addingNote || !newNote.trim()}
                          className="btn btn-primary btn-sm"
                        >
                          {addingNote ? (
                            <>
                              <div className="loading-spinner mr-2"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add Note
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes List */}
              {lead.notes && lead.notes.length > 0 ? (
                <div className="space-y-4">
                  {lead.notes
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((note) => (
                    <div key={note.id} className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {note.createdBy?.name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
                  <p className="text-gray-500">
                    {canEdit 
                      ? 'Add your first note to track interactions with this lead.'
                      : 'No interactions have been recorded for this lead yet.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Status & Priority</h3>
            </div>
            <div className="card-body space-y-4">
              {isEditing ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-input"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as LeadStatus }))}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-input"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as LeadPriority }))}
                    >
                      {priorityOptions.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Status</p>
                    <span className={`badge ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Priority</p>
                    <div className={`flex items-center gap-2 font-medium ${getPriorityColor(lead.priority)}`}>
                      {getPriorityIcon(lead.priority)}
                      {lead.priority}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Assignment & Dates */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Assignment & Timeline</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Assigned To</p>
                {lead.assignedToUser ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {lead.assignedToUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{lead.assignedToUser.name}</p>
                      <p className="text-xs text-gray-500">{lead.assignedToUser.email}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">Unassigned</span>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {new Date(lead.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {new Date(lead.updatedAt).toLocaleDateString()}
                </div>
              </div>

              {lead.leadScore && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Lead Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${lead.leadScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{lead.leadScore}/100</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;
