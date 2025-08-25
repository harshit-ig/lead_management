import mongoose, { Schema } from 'mongoose';
import type { ILead, ILeadNote, LeadSource, LeadStatus, LeadPriority } from '../types';

const leadNoteSchema = new Schema<ILeadNote>({
  id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    trim: true,
    maxlength: [1000, 'Note cannot exceed 1000 characters']
  },
  createdBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const leadSchema = new Schema<ILead>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid email address'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
    unique: true,
    match: [
      /^[\+]?[\d\s\-\(\)\.]{7,25}$/,
      'Please enter a valid phone number'
    ]
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  source: {
    type: String,
    enum: ['Website', 'Social Media', 'Referral', 'Import', 'Manual', 'Cold Call', 'Email Campaign'] as LeadSource[],
    required: [true, 'Source is required'],
    default: 'Manual'
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Interested', 'Not Interested', 'Follow-up', 'Qualified', 'Proposal Sent', 'Negotiating', 'Closed-Won', 'Closed-Lost'] as LeadStatus[],
    default: 'New',
    required: true
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'] as LeadPriority[],
    default: 'Medium',
    required: true
  },
  assignedTo: {
    type: String,
    ref: 'User',
    index: true
  },
  assignedBy: {
    type: String,
    ref: 'User'
  },
  notes: [leadNoteSchema],
  leadScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
leadSchema.index({ email: 1 });
leadSchema.index({ company: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ updatedAt: -1 });

// Compound indexes
leadSchema.index({ status: 1, assignedTo: 1 });
leadSchema.index({ source: 1, createdAt: -1 });
leadSchema.index({ priority: 1, status: 1 });

// Text index for search functionality
leadSchema.index({
  name: 'text',
  email: 'text',
  company: 'text',
  position: 'text'
});

// Virtual populate for assigned user
leadSchema.virtual('assignedToUser', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for assigned by user
leadSchema.virtual('assignedByUser', {
  ref: 'User',
  localField: 'assignedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for notes with user info
leadSchema.virtual('notesWithUsers').get(function() {
  return this.notes.map(note => ({
    ...(note as any),
    createdByUser: undefined // Will be populated separately if needed
  }));
});

// Static method to get lead statistics
leadSchema.statics.getLeadStats = async function(userId?: string) {
  const baseMatch = userId ? { assignedTo: userId } : {};
  
  const [
    totalLeads,
    newLeads,
    contactedLeads,
    qualifiedLeads,
    closedWon,
    closedLost,
    leadsThisMonth,
    leadsByStatus,
    leadsBySource
  ] = await Promise.all([
    this.countDocuments(baseMatch),
    this.countDocuments({ ...baseMatch, status: 'New' }),
    this.countDocuments({ ...baseMatch, status: 'Contacted' }),
    this.countDocuments({ ...baseMatch, status: 'Qualified' }),
    this.countDocuments({ ...baseMatch, status: 'Closed-Won' }),
    this.countDocuments({ ...baseMatch, status: 'Closed-Lost' }),
    this.countDocuments({
      ...baseMatch,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    }),
    this.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    this.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  const conversionRate = totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0;

  return {
    totalLeads,
    newLeads,
    contactedLeads,
    qualifiedLeads,
    closedWon,
    closedLost,
    conversionRate,
    leadsThisMonth,
    leadsByStatus: leadsByStatus.map(item => ({
      status: item._id,
      count: item.count,
      percentage: totalLeads > 0 ? (item.count / totalLeads) * 100 : 0
    })),
    leadsBySource: leadsBySource.map(item => ({
      source: item._id,
      count: item.count,
      percentage: totalLeads > 0 ? (item.count / totalLeads) * 100 : 0
    }))
  };
};

// Static method to get top performers (admin only)
leadSchema.statics.getTopPerformers = async function() {
  return this.aggregate([
    {
      $match: {
        assignedTo: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$assignedTo',
        leadsAssigned: { $sum: 1 },
        leadsConverted: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Closed-Won'] }, 1, 0]
          }
        }
      }
    },
    {
      $addFields: {
        conversionRate: {
          $cond: [
            { $gt: ['$leadsAssigned', 0] },
            { $multiply: [{ $divide: ['$leadsConverted', '$leadsAssigned'] }, 100] },
            0
          ]
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userId: '$_id',
        userName: '$user.name',
        leadsAssigned: 1,
        leadsConverted: 1,
        conversionRate: { $round: ['$conversionRate', 1] }
      }
    },
    {
      $sort: { conversionRate: -1, leadsConverted: -1 }
    },
    {
      $limit: 5
    }
  ]);
};

// Instance method to add note
leadSchema.methods.addNote = function(content: string, createdBy: string) {
  this.notes.push({
    id: new mongoose.Types.ObjectId().toString(),
    content,
    createdBy,
    createdAt: new Date()
  } as ILeadNote);
  return this.save();
};

// Pre-save middleware to update lead score based on status
leadSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const scoreMap: Record<LeadStatus, number> = {
      'New': 20,
      'Contacted': 30,
      'Interested': 50,
      'Not Interested': 10,
      'Follow-up': 40,
      'Qualified': 70,
      'Proposal Sent': 80,
      'Negotiating': 90,
      'Closed-Won': 100,
      'Closed-Lost': 0
    };
    
    this.leadScore = scoreMap[this.status] || 50;
  }
  next();
});

// Create indexes for better performance and uniqueness
leadSchema.index({ email: 1 }, { unique: true });
leadSchema.index({ phone: 1 }, { unique: true });

// Static method to check for duplicates
leadSchema.statics.findDuplicates = async function(email: string, phone: string, excludeId?: string) {
  const query: any = {
    $or: [
      { email: email.toLowerCase().trim() },
      { phone: phone.trim() }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

// Static method to get user-friendly duplicate error
leadSchema.statics.getDuplicateError = function(error: any) {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];
    
    if (field === 'email') {
      return `A lead with email "${value}" already exists`;
    } else if (field === 'phone') {
      return `A lead with phone number "${value}" already exists`;
    }
    return 'A lead with this information already exists';
  }
  return null;
};

const Lead = mongoose.model<ILead>('Lead', leadSchema);

export default Lead;
