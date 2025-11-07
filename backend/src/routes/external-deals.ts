import { Router } from 'express';
import { externalDealController } from '../controllers/external-deal';

const router = Router();

// GET /api/v1/external-deals - List external deals
router.get('/', externalDealController.list);

// GET /api/v1/external-deals/:dealId - Get external deal details
router.get('/:dealId', externalDealController.getById);

// POST /api/v1/external-deals - Create external deal (oracle only)
router.post('/', externalDealController.create);

// PATCH /api/v1/external-deals/:dealId - Update external deal (oracle only)
router.patch('/:dealId', externalDealController.update);

export default router;
