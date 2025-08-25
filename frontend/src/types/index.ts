// Authentication Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Lead Types
export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo?: string;
  assignedBy?: string;
  assignedToUser?: User;
  assignedByUser?: User;
  notes: LeadNote[];
  leadScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  _id: string;
  content: string;
  createdBy: string;
  createdByUser?: User;
  createdAt: string;
}

export type LeadSource = 'Website' | 'Social Media' | 'Referral' | 'Import' | 'Manual' | 'Cold Call' | 'Email Campaign';

export type LeadStatus = 'New' | 'Contacted' | 'Interested' | 'Not Interested' | 'Follow-up' | 'Qualified' | 'Proposal Sent' | 'Negotiating' | 'Closed-Won' | 'Closed-Lost';

export type LeadPriority = 'High' | 'Medium' | 'Low';

// Dashboard Types
export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  closedWon: number;
  closedLost: number;
  conversionRate: number;
  averageResponseTime: number;
  leadsThisMonth: number;
  leadsGrowth: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    leadsAssigned: number;
    leadsConverted: number;
    conversionRate: number;
  }>;
  leadsBySource: Array<{
    source: LeadSource;
    count: number;
    percentage: number;
  }>;
  leadsByStatus: Array<{
    status: LeadStatus;
    count: number;
    percentage: number;
  }>;
  lastUpdated: string;
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface CreateLeadForm {
  name: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
  source: LeadSource;
  priority: LeadPriority;
  notes?: string;
}

export interface UpdateLeadForm {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: LeadSource;
  status?: LeadStatus;
  priority?: LeadPriority;
}

export interface AssignLeadForm {
  leadIds: string[];
  assignToUserId: string;
}

export interface AddNoteForm {
  leadId: string;
  content: string;
}

// Excel Import Types
export interface ExcelUploadResponse {
  success: boolean;
  message: string;
  data: {
    totalRows: number;
    successfulImports: number;
    failedImports: number;
    errors: Array<{
      row: number;
      field: string;
      message: string;
    }>;
    leads: Lead[];
  };
}

// Dynamic Excel Import Types
export interface ExcelSheetInfo {
  name: string;
  rowCount: number;
  columnHeaders: string[];
  hasData: boolean;
}

export interface ExcelFileAnalysis {
  fileName: string;
  fileSize: number;
  sheets: ExcelSheetInfo[];
  uploadedAt: string;
}

export interface FieldMapping {
  leadField: string;
  excelColumn: string;
  isRequired: boolean;
  defaultValue?: string;
}

export interface NoteMapping {
  excelColumns: string[];
  isRequired: boolean;
}

export interface SheetPreviewData {
  headers: string[];
  sampleRows: any[][];
  totalRows: number;
}

export interface DynamicImportRequest {
  fileName: string;
  sheetName: string;
  fieldMappings: FieldMapping[];
  noteMappings?: NoteMapping[];
  skipEmptyRows: boolean;
  startFromRow: number;
}

export interface LeadFieldDefinition {
  name: string;
  label: string;
  type: string;
  required: boolean;
  description: string;
  options?: string[];
  defaultValue?: string;
}

export interface ImportProgress {
  isImporting: boolean;
  progress: number;
  currentStep: string;
  totalRows: number;
  processedRows: number;
}

// Filter Types
export interface LeadFilters {
  status?: LeadStatus[];
  source?: LeadSource[];
  priority?: LeadPriority[];
  assignedTo?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  search?: string;
}

// Sidebar Navigation Type
export interface NavItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}
