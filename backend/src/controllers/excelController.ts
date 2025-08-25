import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import Lead from '../models/Lead';
import type { 
  ExcelUploadResult, 
  ExcelLeadRow, 
  LeadSource, 
  LeadPriority 
} from '../types';

// Valid enum values
const validSources: LeadSource[] = ['Website', 'Social Media', 'Referral', 'Import', 'Manual', 'Cold Call', 'Email Campaign'];
const validPriorities: LeadPriority[] = ['High', 'Medium', 'Low'];

// Helper function to validate and normalize lead data
const validateAndNormalizeLeadRow = (row: ExcelLeadRow, rowIndex: number): { 
  isValid: boolean; 
  lead?: any; 
  errors: Array<{ row: number; field: string; message: string; }>; 
} => {
  const errors: Array<{ row: number; field: string; message: string; }> = [];
  
  // Required fields validation
  if (!row.name || typeof row.name !== 'string' || row.name.trim().length === 0) {
    errors.push({ row: rowIndex, field: 'name', message: 'Name is required' });
  }
  
  if (!row.email || typeof row.email !== 'string' || row.email.trim().length === 0) {
    errors.push({ row: rowIndex, field: 'email', message: 'Email is required' });
  } else {
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.trim())) {
      errors.push({ row: rowIndex, field: 'email', message: 'Invalid email format' });
    }
  }
  
  if (!row.phone || typeof row.phone !== 'string' || row.phone.trim().length === 0) {
    errors.push({ row: rowIndex, field: 'phone', message: 'Phone is required' });
  }
  
  // Company and position are now optional fields
  // No validation required for these fields

  // Source validation
  let source: LeadSource = 'Import';
  if (row.source && typeof row.source === 'string') {
    const normalizedSource = row.source.trim() as LeadSource;
    if (validSources.includes(normalizedSource)) {
      source = normalizedSource;
    } else {
      errors.push({ 
        row: rowIndex, 
        field: 'source', 
        message: `Invalid source. Must be one of: ${validSources.join(', ')}` 
      });
    }
  }

  // Priority validation
  let priority: LeadPriority = 'Medium';
  if (row.priority && typeof row.priority === 'string') {
    const normalizedPriority = row.priority.trim() as LeadPriority;
    if (validPriorities.includes(normalizedPriority)) {
      priority = normalizedPriority;
    } else {
      errors.push({ 
        row: rowIndex, 
        field: 'priority', 
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      });
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Create normalized lead object
  const lead = {
    name: row.name!.trim(),
    email: row.email!.trim().toLowerCase(),
    phone: row.phone!.trim(),
    company: row.company && typeof row.company === 'string' ? row.company.trim() : '',
    position: row.position && typeof row.position === 'string' ? row.position.trim() : '',
    source,
    priority,
    status: 'New' as const
  };

  return { isValid: true, lead, errors: [] };
};

export const importFromExcel = async (req: Request, res: Response): Promise<void> => {
  const uploadedFile = req.file;
  
  try {
    if (!uploadedFile) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
        data: {
          totalRows: 0,
          successfulImports: 0,
          failedImports: 0,
          errors: [],
          leads: []
        }
      });
      return;
    }

    const filePath = uploadedFile.path;
    const fileExtension = path.extname(uploadedFile.originalname).toLowerCase();

    let workbook: XLSX.WorkBook;
    
    // Read the file based on its type
    try {
      if (fileExtension === '.csv') {
        const csvData = fs.readFileSync(filePath, 'utf8');
        workbook = XLSX.read(csvData, { type: 'string' });
      } else {
        workbook = XLSX.readFile(filePath);
      }
    } catch (fileError) {
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      
      res.status(400).json({
        success: false,
        message: 'Failed to read the uploaded file',
        errors: ['The file appears to be corrupted or in an unsupported format'],
        data: {
          totalRows: 0,
          successfulImports: 0,
          failedImports: 0,
          errors: [],
          leads: []
        }
      });
      return;
    }

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      
      res.status(400).json({
        success: false,
        message: 'No worksheets found in the file',
        data: {
          totalRows: 0,
          successfulImports: 0,
          failedImports: 0,
          errors: [],
          leads: []
        }
      });
      return;
    }

    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData: ExcelLeadRow[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false
    }).slice(1) // Skip header row
    .map((row: unknown) => {
      const rowArray = row as any[];
      return {
        name: rowArray[0],
        email: rowArray[1],
        phone: rowArray[2],
        company: rowArray[3],
        position: rowArray[4],
        source: rowArray[5],
        priority: rowArray[6]
      };
    })
    .filter(row => row.name || row.email); // Filter out completely empty rows

    const totalRows = jsonData.length;
    const errors: Array<{ row: number; field: string; message: string; }> = [];
    const validLeads: any[] = [];
    const createdLeads: any[] = [];

    // Validate each row
    for (let i = 0; i < jsonData.length; i++) {
      const validation = validateAndNormalizeLeadRow(jsonData[i], i + 2); // +2 because Excel rows start at 1 and we skip header
      
      if (validation.isValid && validation.lead) {
        validLeads.push(validation.lead);
      } else {
        errors.push(...validation.errors);
      }
    }

    // Check for duplicate emails within the file
    const emailMap = new Map<string, number[]>();
    validLeads.forEach((lead, index) => {
      if (!emailMap.has(lead.email)) {
        emailMap.set(lead.email, []);
      }
      emailMap.get(lead.email)!.push(index);
    });

    // Mark duplicates within file
    emailMap.forEach((indices, email) => {
      if (indices.length > 1) {
        indices.slice(1).forEach(index => {
          errors.push({
            row: index + 2,
            field: 'email',
            message: `Duplicate email within file: ${email}`
          });
        });
      }
    });

    // Remove leads with duplicate emails within file
    const uniqueValidLeads = validLeads.filter((lead, index) => {
      const emailIndices = emailMap.get(lead.email) || [];
      return emailIndices[0] === index; // Keep only the first occurrence
    });

    // Check for existing leads in database
    const existingEmails = await Lead.find({
      email: { $in: uniqueValidLeads.map(lead => lead.email) }
    }).select('email');

    const existingEmailSet = new Set(existingEmails.map(lead => lead.email));

    // Process valid leads
    for (const leadData of uniqueValidLeads) {
      try {
        // Skip if email already exists in database
        if (existingEmailSet.has(leadData.email)) {
          const originalIndex = validLeads.findIndex(l => l.email === leadData.email);
          errors.push({
            row: originalIndex + 2,
            field: 'email',
            message: `Lead with email ${leadData.email} already exists in database`
          });
          continue;
        }

        // Create the lead
        const lead = new Lead({
          ...leadData,
          assignedBy: req.user?.userId
        });

        await lead.save();
        createdLeads.push(lead);
      } catch (createError) {
        const originalIndex = validLeads.findIndex(l => l.email === leadData.email);
        errors.push({
          row: originalIndex + 2,
          field: 'database',
          message: createError instanceof Error ? createError.message : 'Failed to create lead'
        });
      }
    }

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    const result: ExcelUploadResult = {
      success: true,
      message: `Import completed. ${createdLeads.length} leads imported successfully.`,
      data: {
        totalRows,
        successfulImports: createdLeads.length,
        failedImports: totalRows - createdLeads.length,
        errors,
        leads: createdLeads
      }
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Excel import error:', error);
    
    // Clean up the uploaded file if it exists
    if (uploadedFile?.path && fs.existsSync(uploadedFile.path)) {
      fs.unlinkSync(uploadedFile.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process Excel file',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      data: {
        totalRows: 0,
        successfulImports: 0,
        failedImports: 0,
        errors: [],
        leads: []
      }
    });
  }
};

export const getImportTemplate = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Create a sample Excel template
    const templateData = [
      ['Name', 'Email', 'Phone', 'Company', 'Position', 'Source', 'Priority'],
      ['John Doe', 'john.doe@example.com', '+1-555-0123', 'Example Corp', 'Manager', 'Website', 'High'],
      ['Jane Smith', 'jane.smith@company.com', '+1-555-0124', 'Company Inc', 'Director', 'Social Media', 'Medium']
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads Template');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_import_template.xlsx');

    res.send(buffer);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate import template',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};
