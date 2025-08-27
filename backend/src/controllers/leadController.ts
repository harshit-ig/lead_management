import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Lead from '../models/Lead';
import User from '../models/User';
import type { 
  CreateLeadInput, 
  UpdateLeadInput, 
  AssignLeadInput, 
  AddNoteInput
} from '../types';

export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      source, 
      priority, 
      assignedTo, 
      search,
      dateRange
    } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter based on user role
    const filter: any = {};
    
    // If user is not admin, only show their assigned leads
    if (req.user?.role !== 'admin') {
      filter.assignedTo = req.user?.userId;
    }

    // Apply additional filters
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      filter.status = { $in: statusArray };
    }
    
    if (source) {
      const sourceArray = Array.isArray(source) ? source : [source];
      filter.source = { $in: sourceArray };
    }
    
    if (priority) {
      const priorityArray = Array.isArray(priority) ? priority : [priority];
      filter.priority = { $in: priorityArray };
    }
    
    if (assignedTo && req.user?.role === 'admin') {
      const assignedToArray = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
      
      // Check if filtering for unassigned leads (null values)
      const hasNullFilter = assignedToArray.includes(null as any) || assignedToArray.includes('null');
      const otherAssignees = assignedToArray.filter(id => id !== null && id !== 'null');
      
      if (hasNullFilter && otherAssignees.length === 0) {
        // Only looking for unassigned leads
        filter.assignedTo = { $in: [null, undefined] };
      } else if (hasNullFilter && otherAssignees.length > 0) {
        // Looking for both unassigned and specific assignees
        filter.$or = [
          { assignedTo: { $in: [null, undefined] } },
          { assignedTo: { $in: otherAssignees } }
        ];
      } else {
        // Only looking for specific assignees
        filter.assignedTo = { $in: assignedToArray };
      }
    }
    
    if (search) {
      filter.$text = { $search: search as string };
    }
    
    if (dateRange) {
      try {
        const range = typeof dateRange === 'string' ? JSON.parse(dateRange) : dateRange;
        if (range.from && range.to) {
          filter.createdAt = {
            $gte: new Date(range.from),
            $lte: new Date(range.to)
          };
        }
      } catch (error) {
        // Invalid date range format, ignore
      }
    }

    // Get leads and total count
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedToUser', 'name email')
        .populate('assignedByUser', 'name email')
        .populate('notes.createdBy', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Lead.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: 'Leads retrieved successfully',
      data: leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leads',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(id)
      .populate('assignedToUser', 'name email')
      .populate('assignedByUser', 'name email')
      .populate('notes.createdBy', 'name email');

    if (!lead) {
      res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
      return;
    }

    // Check if user can access this lead
    if (req.user?.role !== 'admin' && String(lead.assignedTo) !== String(req.user?.userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lead retrieved successfully',
      data: lead
    });
  } catch (error) {
    console.error('Get lead by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lead',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadData: CreateLeadInput = req.body;

    // Validate required fields - only name, email, and phone are required
    const requiredFields = ['name', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !leadData[field as keyof CreateLeadInput]);
    
    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: [`Required fields: ${missingFields.join(', ')}`]
      });
      return;
    }

    // Check for duplicate email first, then phone only if email doesn't exist
    const existingEmail = await Lead.findOne({ email: leadData.email.toLowerCase().trim() });
    if (existingEmail) {
      res.status(400).json({
        success: false,
        message: 'Duplicate lead detected',
        errors: [`A lead with email "${leadData.email}" already exists`],
        data: {
          existingLead: {
            _id: existingEmail._id,
            name: existingEmail.name,
            email: existingEmail.email,
            phone: existingEmail.phone,
            company: existingEmail.company
          }
        }
      });
      return;
    }
    
    // Only check phone if email doesn't exist
    const existingPhone = await Lead.findOne({ phone: leadData.phone.trim() });
    if (existingPhone) {
      res.status(400).json({
        success: false,
        message: 'Duplicate lead detected',
        errors: [`A lead with phone number "${leadData.phone}" already exists`],
        data: {
          existingLead: {
            _id: existingPhone._id,
            name: existingPhone.name,
            email: existingPhone.email,
            phone: existingPhone.phone,
            company: existingPhone.company
          }
        }
      });
      return;
    }
    const {notes, ...leadFields} = leadData;
    // Create lead
    const lead = new Lead({
      ...leadFields,
      assignedBy: req.user?.userId
    });

    // Add initial note if provided
    if (notes) {
      lead.notes.push({
        id: new mongoose.Types.ObjectId().toString(),
        content: notes,
        createdBy: new mongoose.Types.ObjectId(req.user?.userId || ''),
        createdAt: new Date()
      });
    }

    await lead.save();

    // Populate the response
    await lead.populate('assignedByUser', 'name email');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error: any) {
    console.error('Create lead error:', error);
    
    // Handle MongoDB duplicate key errors
    const duplicateError = (Lead as any).getDuplicateError(error);
    if (duplicateError) {
      res.status(400).json({
        success: false,
        message: 'Duplicate lead detected',
        errors: [duplicateError]
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create lead',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const updateLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateLeadInput = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
      return;
    }

    // Check if user can update this lead
    if (req.user?.role !== 'admin' && String(lead.assignedTo) !== String(req.user?.userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Check for duplicates if email or phone is being updated
    if (updateData.email) {
      const existingEmail = await Lead.findOne({ 
        email: updateData.email.toLowerCase().trim(),
        _id: { $ne: id }
      });
      if (existingEmail) {
        res.status(400).json({
          success: false,
          message: 'Duplicate lead detected',
          errors: [`A lead with email "${updateData.email}" already exists`],
          data: {
            existingLead: {
              _id: existingEmail._id,
              name: existingEmail.name,
              email: existingEmail.email,
              phone: existingEmail.phone,
              company: existingEmail.company
            }
          }
        });
        return;
      }
    }
    
    if (updateData.phone) {
      const existingPhone = await Lead.findOne({ 
        phone: updateData.phone.trim(),
        _id: { $ne: id }
      });
      if (existingPhone) {
        res.status(400).json({
          success: false,
          message: 'Duplicate lead detected',
          errors: [`A lead with phone number "${updateData.phone}" already exists`],
          data: {
            existingLead: {
              _id: existingPhone._id,
              name: existingPhone.name,
              email: existingPhone.email,
              phone: existingPhone.phone,
              company: existingPhone.company
            }
          }
        });
        return;
      }
    }

    // Update allowed fields
    const allowedFields = ['name', 'email', 'phone', 'company', 'position', 'source', 'status', 'priority'];
    allowedFields.forEach(field => {
      if (updateData[field as keyof UpdateLeadInput] !== undefined) {
        (lead as any)[field] = updateData[field as keyof UpdateLeadInput];
      }
    });

    await lead.save();

    // Populate the response
    await lead.populate('assignedToUser', 'name email');
    await lead.populate('assignedByUser', 'name email');

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error: any) {
    console.error('Update lead error:', error);
    
    // Handle MongoDB duplicate key errors
    const duplicateError = (Lead as any).getDuplicateError(error);
    if (duplicateError) {
      res.status(400).json({
        success: false,
        message: 'Duplicate lead detected',
        errors: [duplicateError]
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update lead',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admins can delete leads
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
      return;
    }

    await Lead.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lead',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const assignLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadIds, assignToUserId }: AssignLeadInput = req.body;

    // Only admins can assign leads
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    // Validate input
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Lead IDs are required',
        errors: ['Please provide an array of lead IDs']
      });
      return;
    }

    if (!assignToUserId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
        errors: ['Please provide a user ID to assign leads to']
      });
      return;
    }

    // Check if the user exists
    const assignToUser = await User.findById(assignToUserId);
    if (!assignToUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['The specified user does not exist']
      });
      return;
    }

    // Update leads
    const result = await Lead.updateMany(
      { _id: { $in: leadIds } },
      { 
        assignedTo: assignToUserId,
        assignedBy: req.user?.userId,
        updatedAt: new Date()
      }
    );

    // Get updated leads
    const updatedLeads = await Lead.find({ _id: { $in: leadIds } })
      .populate('assignedToUser', 'name email')
      .populate('assignedByUser', 'name email');

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} leads assigned successfully`,
      data: updatedLeads
    });
  } catch (error) {
    console.error('Assign leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign leads',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const addNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId, content }: AddNoteInput = req.body;

    // Validate input
    if (!leadId || !content) {
      res.status(400).json({
        success: false,
        message: 'Lead ID and note content are required',
        errors: ['Please provide both lead ID and note content']
      });
      return;
    }

    if (content.trim().length < 1) {
      res.status(400).json({
        success: false,
        message: 'Note content cannot be empty',
        errors: ['Please provide valid note content']
      });
      return;
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
      return;
    }

    // Check if user can add notes to this lead
    if (req.user?.role !== 'admin' && String(lead.assignedTo) !== String(req.user?.userId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Add note using the model method
    if (!req.user?.userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
        errors: ['Please provide a valid user ID']
      });
      return;
    }
    
    await lead.addNote(content.trim(), new mongoose.Types.ObjectId(req.user.userId));

    // Populate the response
    await lead.populate('assignedToUser', 'name email');
    await lead.populate('assignedByUser', 'name email');
    await lead.populate('notes.createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: lead
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const getMyLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = { assignedTo: req.user?.userId };

    // Get leads and total count
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedByUser', 'name email')
        .populate('notes.createdBy', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Lead.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: 'My leads retrieved successfully',
      data: leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get my leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your leads',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};
