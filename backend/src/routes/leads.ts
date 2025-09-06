import { Router } from 'express';
import { 
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  assignLeads,
  addNote,
  getMyLeads,
  getMyLeadsStats,
  getDistinctLocations
} from '../controllers/leadController';
import { 
  analyzeExcelFile,
  getSheetPreview,
  importWithMapping,
  getLeadFields
} from '../controllers/excelController';
import { uploadExcel, handleUploadError, validateFilePresence } from '../middleware/upload';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// All lead routes require authentication
router.use(authenticateToken, requireAuth);

// My leads endpoint (for users to see their assigned leads)
router.get('/my-leads', getMyLeads);
// My leads stats endpoint (for users to get stats for all their assigned leads)
router.get('/my-leads/stats', getMyLeadsStats);

// Get distinct locations for filtering
router.get('/locations', getDistinctLocations);

// Lead assignment (admin only)
router.post('/assign', requireAdmin, assignLeads);

// Add note to lead
router.post('/notes', addNote);

// Smart Excel import endpoints (admin only)
router.get('/import/fields', requireAdmin, getLeadFields);
router.post('/import/analyze', requireAdmin, uploadExcel, handleUploadError, validateFilePresence, analyzeExcelFile);
router.post('/import/preview', requireAdmin, uploadExcel, handleUploadError, validateFilePresence, getSheetPreview);
router.post('/import', requireAdmin, uploadExcel, handleUploadError, validateFilePresence, importWithMapping);

// CRUD operations
router.get('/', getLeads); // Get all leads (filtered by role)
router.get('/:id', getLeadById); // Get single lead
router.post('/', createLead); // Create new lead
router.put('/:id', updateLead); // Update lead
router.delete('/:id', requireAdmin, deleteLead); // Delete lead (admin only)

export default router;
