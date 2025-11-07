import { Router } from 'express';
import { listingController } from '../controllers/listing';

const router = Router();

// GET /api/v1/listings - List marketplace listings
router.get('/', listingController.list);

// GET /api/v1/listings/:listingId - Get listing details
router.get('/:listingId', listingController.getById);

// POST /api/v1/listings - Create a listing
router.post('/', listingController.create);

// PATCH /api/v1/listings/:listingId/deactivate - Deactivate a listing
router.patch('/:listingId/deactivate', listingController.deactivate);

// DELETE /api/v1/listings/:listingId - Delete a listing
router.delete('/:listingId', listingController.delete);

export default router;
