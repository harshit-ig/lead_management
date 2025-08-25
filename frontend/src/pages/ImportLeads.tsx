import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { leadApi } from '../lib/api';
import type { ExcelUploadResponse } from '../types';
import { 
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  Users,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const ImportLeads: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ExcelUploadResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error('Please select a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    
    try {
      const response = await leadApi.importFromExcel(selectedFile);
      setUploadResult(response);
      
      if (response.success) {
        toast.success(`Successfully imported ${response.data.successfulImports} leads!`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error(response.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await leadApi.getImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href="/leads" className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </a>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Leads</h1>
          <p className="text-gray-600 mt-2">Upload leads from Excel or CSV files</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="card border-l-4 border-l-blue-500">
        <div className="card-body">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Before you start</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Download the template file to see the required column format</li>
                  <li>Fill in your lead data using the exact column headers</li>
                  <li>Save your file as .xlsx, .xls, or .csv format</li>
                  <li>Upload your file using the area below</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Template */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Download Template</h3>
              <p className="text-gray-600">Get the Excel template with the correct format</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="btn btn-primary"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="card">
        <div className="card-body">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : selectedFile 
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">File Selected</h3>
                  <p className="text-gray-600">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn btn-primary"
                  >
                    {uploading ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload File
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearFile}
                    disabled={uploading}
                    className="btn btn-secondary"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-300 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Upload your file</h3>
                  <p className="text-gray-600">Drag and drop your Excel or CSV file here, or click to browse</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports .xlsx, .xls, and .csv files up to 10MB
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary"
                >
                  <FileText className="w-4 h-4" />
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Results */}
      {uploadResult && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Import Results</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {uploadResult.data.totalRows}
                </div>
                <div className="text-sm text-gray-500">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.data.successfulImports}
                </div>
                <div className="text-sm text-gray-500">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.data.failedImports}
                </div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
            </div>

            {uploadResult.success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-green-800 font-medium">Import Successful!</h4>
                    <p className="text-green-700 text-sm mt-1">
                      {uploadResult.data.successfulImports} leads have been imported successfully.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-red-800 font-medium">Import Issues</h4>
                    <p className="text-red-700 text-sm mt-1">
                      Some leads could not be imported. Please check the errors below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {uploadResult.data.errors && uploadResult.data.errors.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Import Errors ({uploadResult.data.errors.length})
                </h4>
                <div className="max-h-64 overflow-y-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Field</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.data.errors.map((error, index) => (
                        <tr key={index}>
                          <td className="font-mono text-sm">{error.row}</td>
                          <td className="font-medium">{error.field}</td>
                          <td className="text-red-600">{error.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Success Actions */}
            {uploadResult.success && uploadResult.data.successfulImports > 0 && (
              <div className="mt-6 flex gap-3">
                <a href="/leads" className="btn btn-primary">
                  <Users className="w-4 h-4" />
                  View Imported Leads
                </a>
                <a href="/leads/assign" className="btn btn-secondary">
                  <Users className="w-4 h-4" />
                  Assign Leads
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Format Requirements */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Required Format</h3>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Column Name</th>
                  <th>Required</th>
                  <th>Description</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono text-sm">Name</td>
                  <td><span className="badge badge-error">Yes</span></td>
                  <td>Lead's full name</td>
                  <td>John Doe</td>
                </tr>
                <tr>
                  <td className="font-mono text-sm">Email</td>
                  <td><span className="badge badge-error">Yes</span></td>
                  <td>Valid email address</td>
                  <td>john.doe@company.com</td>
                </tr>
                <tr>
                  <td className="font-mono text-sm">Phone</td>
                  <td><span className="badge badge-error">Yes</span></td>
                  <td>Phone number</td>
                  <td>+1 (555) 123-4567</td>
                </tr>
                <tr>
                  <td className="font-mono text-sm">Company</td>
                  <td><span className="badge badge-gray">No</span></td>
                  <td>Company name</td>
                  <td>Acme Corporation</td>
                </tr>
                <tr>
                  <td className="font-mono text-sm">Position</td>
                  <td><span className="badge badge-gray">No</span></td>
                  <td>Job title</td>
                  <td>Marketing Manager</td>
                </tr>
                <tr>
                  <td className="font-mono text-sm">Source</td>
                  <td><span className="badge badge-gray">No</span></td>
                  <td>Lead source</td>
                  <td>Website, Social Media, Referral</td>
                </tr>
                <tr>
                  <td className="font-mono text-sm">Priority</td>
                  <td><span className="badge badge-gray">No</span></td>
                  <td>Priority level</td>
                  <td>High, Medium, Low</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportLeads;
