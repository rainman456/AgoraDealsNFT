import { Router } from 'express';
import { merchantController } from '../controllers/merchant';

const router = Router();

// POST /api/v1/merchants/register
router.post('/register', merchantController.register.bind(merchantController));

// GET /api/v1/merchants/:merchantId
router.get('/:merchantId', merchantController.getProfile.bind(merchantController));

// GET /api/v1/merchants
router.get('/', merchantController.list.bind(merchantController));

export default router;
