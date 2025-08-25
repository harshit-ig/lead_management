import axios, { type AxiosResponse } from 'axios';
import type { 
  ApiResponse, 
  PaginatedResponse,
  LoginCredentials, 
  User, 
  Lead, 
  CreateLeadForm, 
  UpdateLeadForm, 
  AssignLeadForm,
  AddNoteForm,
  DashboardStats,
  LeadFilters,
  ExcelUploadResponse,
  CreateUserForm
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleResponse = <T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> => {
  return response.data;
};

const handleError = (error: any): ApiResponse => {
  if (error.response?.data) {
    return error.response.data;
  }
  return {
    success: false,
    message: error.message || 'An unexpected error occurred',
  };
};

// Authentication API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      const response = await api.post('/auth/login', credentials);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  me: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get('/auth/me');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await api.post('/auth/logout');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  updateProfile: async (profileData: { name: string; email?: string }): Promise<ApiResponse<User>> => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  changePassword: async (passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse> => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// User Management API
export const userApi = {
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    try {
      const response = await api.get('/users');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  createUser: async (userData: CreateUserForm): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post('/users', userData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  deleteUser: async (userId: string): Promise<ApiResponse> => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get(`/users/${userId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getUserStats: async (): Promise<ApiResponse<{ totalUsers: number; activeUsers: number; adminUsers: number; userUsers: number }>> => {
    try {
      const response = await api.get('/users/stats');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

// Lead Management API
export const leadApi = {
  getLeads: async (filters?: LeadFilters, page?: number, limit?: number): Promise<PaginatedResponse<Lead>> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else if (typeof value === 'object') {
              params.append(key, JSON.stringify(value));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());

      const response = await api.get(`/leads?${params.toString()}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch leads',
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };
    }
  },

  getLead: async (leadId: string): Promise<ApiResponse<Lead>> => {
    try {
      const response = await api.get(`/leads/${leadId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  createLead: async (leadData: CreateLeadForm): Promise<ApiResponse<Lead>> => {
    try {
      const response = await api.post('/leads', leadData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  updateLead: async (leadId: string, leadData: UpdateLeadForm): Promise<ApiResponse<Lead>> => {
    try {
      const response = await api.put(`/leads/${leadId}`, leadData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  deleteLead: async (leadId: string): Promise<ApiResponse> => {
    try {
      const response = await api.delete(`/leads/${leadId}`);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  assignLeads: async (assignmentData: AssignLeadForm): Promise<ApiResponse<Lead[]>> => {
    try {
      const response = await api.post('/leads/assign', assignmentData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  addNote: async (noteData: AddNoteForm): Promise<ApiResponse<Lead>> => {
    try {
      const response = await api.post('/leads/notes', noteData);
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  importFromExcel: async (file: File): Promise<ExcelUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/leads/import/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to import Excel file',
        data: {
          totalRows: 0,
          successfulImports: 0,
          failedImports: 0,
          errors: [],
          leads: []
        }
      };
    }
  },

  getMyLeads: async (page?: number, limit?: number): Promise<PaginatedResponse<Lead>> => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());

      const response = await api.get(`/leads/my-leads?${params.toString()}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch your leads',
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };
    }
  },

  getImportTemplate: async (): Promise<Blob> => {
    try {
      const response = await api.get('/leads/import/template', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to download template');
    }
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      const response = await api.get('/dashboard/stats');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getAdminStats: async (): Promise<ApiResponse<DashboardStats>> => {
    try {
      const response = await api.get('/dashboard/admin-stats');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getLeadsByStatus: async (): Promise<ApiResponse<Array<{ status: string; count: number; percentage: number }>>> => {
    try {
      const response = await api.get('/dashboard/leads/by-status');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getLeadsBySource: async (): Promise<ApiResponse<Array<{ source: string; count: number; percentage: number }>>> => {
    try {
      const response = await api.get('/dashboard/leads/by-source');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getRecentActivity: async (): Promise<ApiResponse<Array<{ type: string; description: string; timestamp: string; user: string }>>> => {
    try {
      const response = await api.get('/dashboard/recent-activity');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getLeadMetrics: async (): Promise<ApiResponse<{ conversionRate: number; averageResponseTime: number; leadsThisWeek: number; leadsThisMonth: number }>> => {
    try {
      const response = await api.get('/dashboard/metrics');
      return handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

export default api;
