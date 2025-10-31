import { Router } from 'express';
import { externalController } from '../controllers/external';

const router = Router();

// POST /api/v1/external/sync-flights
router.post('/sync-flights', externalController.syncFlights.bind(externalController));

// POST /api/v1/external/sync-hotels
router.post('/sync-hotels', externalController.syncHotels.bind(externalController));

// GET /api/v1/external/deals
router.get('/deals', externalController.getDeals.bind(externalController));

export default router;
