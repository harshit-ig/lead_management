import React, { useState, useEffect, useRef } from 'react';
import { leadApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { 
  ExcelFileAnalysis, 
  SheetPreviewData, 
  FieldMapping, 
  LeadFieldDefinition,
  ExcelUploadResponse,
  DynamicImportRequest
} from '../types';
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Eye,
  CheckCircle,
  AlertCircle,
  Link,
  Trash2,
  Play,
  RotateCcw,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const SmartImportLeads: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'map' | 'preview' | 'import' | 'complete'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileAnalysis, setFileAnalysis] = useState<ExcelFileAnalysis | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sheetPreview, setSheetPreview] = useState<SheetPreviewData | null>(null);
  const [leadFields, setLeadFields] = useState<LeadFieldDefinition[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ExcelUploadResponse | null>(null);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">This feature is only available to administrators.</p>
        <a href="/leads" className="btn btn-primary">Go to Leads</a>
      </div>
    );
  }

  // Load lead fields on component mount
  useEffect(() => {
    loadLeadFields();
  }, []);

  // Auto-preview sheet when selectedSheet changes
  useEffect(() => {
    if (selectedFile && selectedSheet && currentStep === 'map') {
      previewSheet(selectedFile, selectedSheet);
    }
  }, [selectedSheet, selectedFile, currentStep]);

  const loadLeadFields = async () => {
    try {
      const response = await leadApi.getLeadFields();
      if (response.success && response.data) {
        setLeadFields(response.data);
      }
    } catch (error) {
      console.error('Failed to load lead fields:', error);
      toast.error('Failed to load lead fields');
    }
  };

  // File upload handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid Excel (.xlsx, .xls) or CSV file');
        return;
      }
      
      setSelectedFile(file);
      setCurrentStep('analyze');
      analyzeFile(file);
    }
  };

  // Analyze uploaded file
  const analyzeFile = async (file: File) => {
    setIsLoading(true);
    try {
      const response = await leadApi.analyzeExcelFile(file);
      if (response.success && response.data) {
        setFileAnalysis(response.data);
        // Auto-select first sheet with data
        const sheetWithData = response.data.sheets.find(sheet => sheet.hasData);
        if (sheetWithData) {
          setSelectedSheet(sheetWithData.name);
          // Don't call previewSheet directly - let useEffect handle it
        }
        setCurrentStep('map');
      } else {
        toast.error(response.message || 'Failed to analyze file');
        resetImport();
      }
    } catch (error) {
      console.error('File analysis error:', error);
      toast.error('Failed to analyze file');
      resetImport();
    } finally {
      setIsLoading(false);
    }
  };

  // Preview sheet data
  const previewSheet = async (file: File, sheetName: string) => {
    setIsLoading(true);
    try {
      const response = await leadApi.getSheetPreview(file, sheetName, 5);
      if (response.success && response.data) {
        setSheetPreview(response.data);
        initializeFieldMappings(response.data.headers);
      } else {
        toast.error('Failed to preview sheet data');
      }
    } catch (error) {
      console.error('Sheet preview error:', error);
      toast.error('Failed to preview sheet data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize field mappings with smart matching
  const initializeFieldMappings = (headers: string[]) => {
    const mappings: FieldMapping[] = [];
    
    leadFields.forEach(field => {
      // Smart header matching
      const matchedHeader = headers.find(header => {
        const headerLower = header.toLowerCase().trim();
        const fieldLower = field.name.toLowerCase();
        const labelLower = field.label.toLowerCase();
        
        return headerLower === fieldLower || 
               headerLower === labelLower ||
               headerLower.includes(fieldLower) ||
               fieldLower.includes(headerLower);
      });

      if (matchedHeader || field.required) {
        mappings.push({
          leadField: field.name,
          excelColumn: matchedHeader || '',
          isRequired: field.required,
          defaultValue: field.defaultValue
        });
      }
    });

    setFieldMappings(mappings);
  };

  // Update field mapping
  const updateFieldMapping = (leadField: string, excelColumn: string) => {
    setFieldMappings(prev => 
      prev.map(mapping => 
        mapping.leadField === leadField 
          ? { ...mapping, excelColumn }
          : mapping
      )
    );
  };

  // Add new field mapping
  const addFieldMapping = () => {
    const unmappedFields = leadFields.filter(field => 
      !fieldMappings.some(mapping => mapping.leadField === field.name)
    );
    
    if (unmappedFields.length > 0) {
      const newMapping: FieldMapping = {
        leadField: unmappedFields[0].name,
        excelColumn: '',
        isRequired: unmappedFields[0].required,
        defaultValue: unmappedFields[0].defaultValue
      };
      setFieldMappings(prev => [...prev, newMapping]);
    }
  };

  // Remove field mapping
  const removeFieldMapping = (leadField: string) => {
    setFieldMappings(prev => 
      prev.filter(mapping => mapping.leadField !== leadField)
    );
  };

  // Validate mappings
  const validateMappings = (): boolean => {
    const requiredFields = fieldMappings.filter(mapping => mapping.isRequired);
    const unmappedRequired = requiredFields.filter(mapping => !mapping.excelColumn);
    
    if (unmappedRequired.length > 0) {
      toast.error(`Please map all required fields: ${unmappedRequired.map(m => m.leadField).join(', ')}`);
      return false;
    }
    
    return true;
  };

  // Execute import
  const executeImport = async () => {
    if (!selectedFile || !selectedSheet || !validateMappings()) {
      return;
    }

    setIsLoading(true);
    setCurrentStep('import');

    try {
      const importRequest: Omit<DynamicImportRequest, 'fileName'> = {
        sheetName: selectedSheet,
        fieldMappings: fieldMappings.filter(mapping => mapping.excelColumn),
        skipEmptyRows: true,
        startFromRow: 2
      };

      const result = await leadApi.importWithMapping(selectedFile, importRequest);
      setImportResult(result);
      setCurrentStep('complete');

      if (result.success) {
        toast.success(`Successfully imported ${result.data.successfulImports} leads!`);
      } else {
        toast.error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import leads');
      setCurrentStep('map');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset import process
  const resetImport = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setFileAnalysis(null);
    setSelectedSheet('');
    setSheetPreview(null);
    setFieldMappings([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Sheet change handler
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    // useEffect will handle the preview automatically
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Excel Import</h1>
          <p className="text-gray-600">Import leads from any Excel format with intelligent field mapping</p>
        </div>
        
        {currentStep !== 'upload' && (
          <button onClick={resetImport} className="btn btn-outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm border">
        {[
          { key: 'upload', label: 'Upload File', icon: Upload },
          { key: 'analyze', label: 'Analyze Sheets', icon: FileSpreadsheet },
          { key: 'map', label: 'Map Fields', icon: Link },
          { key: 'preview', label: 'Preview Data', icon: Eye },
          { key: 'import', label: 'Import Leads', icon: Users }
        ].map((step, index, array) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.key;
          const isCompleted = ['upload', 'analyze', 'map', 'preview', 'import'].indexOf(currentStep) > 
                            ['upload', 'analyze', 'map', 'preview', 'import'].indexOf(step.key);
          
          return (
            <React.Fragment key={step.key}>
              <div className={`flex items-center space-x-2 ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`p-2 rounded-full ${isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span className="font-medium">{step.label}</span>
              </div>
              {index < array.length - 1 && (
                <ArrowRight className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-gray-300'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="p-8">
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h3>
                <p className="text-gray-600 mb-4">
                  Select an Excel (.xlsx, .xls) or CSV file to import leads.<br />
                  The system will automatically detect and analyze all sheets.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Analyzing...' : 'Choose File'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analysis & Mapping Step */}
        {(currentStep === 'analyze' || currentStep === 'map') && fileAnalysis && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Info & Sheet Selection */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">File Information</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Name:</span> {fileAnalysis.fileName}</p>
                    <p><span className="font-medium">Size:</span> {Math.round(fileAnalysis.fileSize / 1024)} KB</p>
                    <p><span className="font-medium">Sheets:</span> {fileAnalysis.sheets.length}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Select Sheet to Import</h3>
                  <div className="space-y-2">
                    {fileAnalysis.sheets.map((sheet) => (
                      <div
                        key={sheet.name}
                        onClick={() => handleSheetChange(sheet.name)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSheet === sheet.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{sheet.name}</p>
                            <p className="text-sm text-gray-600">
                              {sheet.rowCount} rows, {sheet.columnHeaders.length} columns
                            </p>
                          </div>
                          {sheet.hasData ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field Mapping */}
              {currentStep === 'map' && sheetPreview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Map Excel Columns to Lead Fields</h3>
                    <button onClick={addFieldMapping} className="btn btn-sm btn-outline">
                      Add Mapping
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {fieldMappings.map((mapping, index) => {
                      const fieldDef = leadFields.find(f => f.name === mapping.leadField);
                      return (
                        <div key={`${mapping.leadField}-${index}`} className="border rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            {/* Lead Field */}
                            <div className="flex-1">
                              <select
                                value={mapping.leadField}
                                onChange={(e) => {
                                  const newMappings = [...fieldMappings];
                                  const fieldDef = leadFields.find(f => f.name === e.target.value);
                                  newMappings[index] = {
                                    ...mapping,
                                    leadField: e.target.value,
                                    isRequired: fieldDef?.required || false,
                                    defaultValue: fieldDef?.defaultValue
                                  };
                                  setFieldMappings(newMappings);
                                }}
                                className="select select-sm w-full"
                              >
                                {leadFields.map(field => (
                                  <option key={field.name} value={field.name}>
                                    {field.label} {field.required && '*'}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Arrow */}
                            <ArrowRight className="w-4 h-4 text-gray-400" />

                            {/* Excel Column */}
                            <div className="flex-1">
                              <select
                                value={mapping.excelColumn}
                                onChange={(e) => updateFieldMapping(mapping.leadField, e.target.value)}
                                className={`select select-sm w-full ${
                                  mapping.isRequired && !mapping.excelColumn ? 'border-red-300' : ''
                                }`}
                              >
                                <option value="">Select column...</option>
                                {sheetPreview.headers.map((header, idx) => (
                                  <option key={idx} value={header}>
                                    {header || `Column ${idx + 1}`}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Remove Button */}
                            {!mapping.isRequired && (
                              <button
                                onClick={() => removeFieldMapping(mapping.leadField)}
                                className="btn btn-sm btn-ghost text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {fieldDef && (
                            <p className="text-xs text-gray-500 mt-1">{fieldDef.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => validateMappings() && setCurrentStep('preview')}
                      className="btn btn-primary"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && sheetPreview && (
          <div className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Data Preview</h3>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    {fieldMappings
                      .filter(mapping => mapping.excelColumn)
                      .map(mapping => {
                        const fieldDef = leadFields.find(f => f.name === mapping.leadField);
                        return (
                          <th key={mapping.leadField} className="text-left">
                            <div>
                              <p className="font-medium">{fieldDef?.label}</p>
                              <p className="text-xs text-gray-500">← {mapping.excelColumn}</p>
                            </div>
                          </th>
                        );
                      })}
                  </tr>
                </thead>
                <tbody>
                  {sheetPreview.sampleRows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {fieldMappings
                        .filter(mapping => mapping.excelColumn)
                        .map(mapping => {
                          const columnIndex = sheetPreview.headers.indexOf(mapping.excelColumn);
                          const value = columnIndex >= 0 ? row[columnIndex] : '';
                          return (
                            <td key={mapping.leadField} className="text-sm">
                              {value || <span className="text-gray-400">—</span>}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing first 5 rows. Total rows to import: {sheetPreview.totalRows - 1}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep('map')}
                  className="btn btn-outline"
                >
                  Back to Mapping
                </button>
                <button
                  onClick={executeImport}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Import Leads
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Progress */}
        {currentStep === 'import' && (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Leads...</h3>
            <p className="text-gray-600">Please wait while we process your data.</p>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && importResult && (
          <div className="p-8">
            <div className="text-center mb-6">
              {importResult.success ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {importResult.success ? 'Import Successful!' : 'Import Issues Detected'}
              </h3>
              
              <div className="text-lg text-gray-600 space-y-1">
                <p>Successfully imported: <span className="font-semibold text-green-600">{importResult.data.successfulImports}</span> leads</p>
                {importResult.data.failedImports > 0 && (
                  <p>Failed imports: <span className="font-semibold text-red-600">{importResult.data.failedImports}</span></p>
                )}
              </div>
            </div>

            {importResult.data.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-red-900 mb-2">Import Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.data.errors.slice(0, 10).map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      Row {error.row}: {error.message}
                    </p>
                  ))}
                  {importResult.data.errors.length > 10 && (
                    <p className="text-sm text-red-600 font-medium">
                      ... and {importResult.data.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-3">
              <button
                onClick={resetImport}
                className="btn btn-outline"
              >
                Import Another File
              </button>
              <a href="/leads" className="btn btn-primary">
                View All Leads
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartImportLeads;
