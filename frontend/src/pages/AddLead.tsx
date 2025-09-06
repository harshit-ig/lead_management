import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadApi } from '../lib/api';
import type { CreateLeadForm, LeadSource, LeadPriority } from '../types';
import { 
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Globe,
  MapPin,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const AddLead: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateLeadForm>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    location: '',
    source: 'Manual',
    priority: 'Medium',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const sourceOptions: LeadSource[] = [
    'Website', 'Social Media', 'Referral', 'Import', 'Manual', 'Cold Call', 'Email Campaign'
  ];

  const priorityOptions: LeadPriority[] = ['High', 'Medium', 'Low'];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation - only name, email, and phone are required
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Company and position are now optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);

    try {
      const response = await leadApi.createLead(formData);
      
      if (response.success) {
        toast.success('Lead created successfully!');
        navigate('/leads');
      } else {
        toast.error(response.message || 'Failed to create lead');
      }
    } catch (error) {
      console.error('Create lead error:', error);
      toast.error('Failed to create lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (Object.values(formData).some(value => value.trim() !== '')) {
      if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="btn btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Lead</h1>
          <p className="text-gray-600 mt-2">Create a new lead record in the system</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Personal Information</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="form-error">{errors.name}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="position" className="form-label">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className={`form-input pl-10 ${errors.position ? 'border-red-500' : ''}`}
                    placeholder="e.g., Marketing Manager"
                  />
                </div>
                {errors.position && (
                  <p className="form-error">{errors.position}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Contact Information</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="john.doe@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`form-input pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {errors.phone && (
                  <p className="form-error">{errors.phone}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="company" className="form-label">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={`form-input pl-10 ${errors.company ? 'border-red-500' : ''}`}
                    placeholder="Acme Corporation"
                  />
                </div>
                {errors.company && (
                  <p className="form-error">{errors.company}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="location" className="form-label">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`form-input pl-10 ${errors.location ? 'border-red-500' : ''}`}
                    placeholder="e.g., UK, USA, Germany"
                  />
                </div>
                {errors.location && (
                  <p className="form-error">{errors.location}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lead Details */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Lead Details</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="source" className="form-label">
                  Lead Source
                </label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {sourceOptions.map(source => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority" className="form-label">
                  Priority Level
                </label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority} value={priority}>
                        {priority} Priority
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group md:col-span-2">
                <label htmlFor="notes" className="form-label">
                  Initial Notes
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="form-input pl-10"
                    placeholder="Add any initial notes about this lead (optional)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Creating Lead...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Lead
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary btn-lg"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="card border-l-4 border-l-blue-500">
        <div className="card-body">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Tips for adding leads</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Ensure all contact information is accurate and up-to-date</li>
                  <li>Choose the appropriate lead source to track marketing effectiveness</li>
                  <li>Set priority based on lead quality and potential value</li>
                  <li>Add detailed initial notes to provide context for future follow-ups</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLead;
