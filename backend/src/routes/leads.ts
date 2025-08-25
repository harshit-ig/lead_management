import { Router } from 'express';
import { 
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  assignLeads,
  addNote,
  getMyLeads
} from '../controllers/leadController';
import { importFromExcel, getImportTemplate } from '../controllers/excelController';
import { uploadExcel, handleUploadError, validateFilePresence } from '../middleware/upload';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// All lead routes require authentication
router.use(authenticateToken, requireAuth);

// My leads endpoint (for users to see their assigned leads)
router.get('/my-leads', getMyLeads);

// Lead assignment (admin only)
router.post('/assign', requireAdmin, assignLeads);

// Add note to lead
router.post('/notes', addNote);

// Excel import endpoints (admin only)
router.get('/import/template', requireAdmin, getImportTemplate);
router.post('/import/excel', requireAdmin, uploadExcel, handleUploadError, validateFilePresence, importFromExcel);

// CRUD operations
router.get('/', getLeads); // Get all leads (filtered by role)
router.get('/:id', getLeadById); // Get single lead
router.post('/', createLead); // Create new lead
router.put('/:id', updateLead); // Update lead
router.delete('/:id', requireAdmin, deleteLead); // Delete lead (admin only)

export default router;
