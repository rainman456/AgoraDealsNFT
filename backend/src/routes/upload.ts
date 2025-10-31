import { Router, Request, Response } from 'express';
import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

const router = Router();

// Ensure upload directories exist
const uploadDirs = ['uploads/promotions', 'uploads/merchants', 'uploads/coupons'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const type = req.params.type || 'promotions';
    const uploadPath = `uploads/${type}`;
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * Upload image
 * POST /api/upload/:type
 * type can be: promotions, merchants, coupons
 */
router.post('/:type', upload.single('image'), (req: MulterRequest, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    const fileUrl = `/uploads/${req.params.type}/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error: any) {
    logger.error('File upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file',
    });
  }
});

/**
 * Delete image
 * DELETE /api/upload/:type/:filename
 */
router.delete('/:type/:filename', (req, res): void => {
  try {
    const filePath = path.join('uploads', req.params.type, req.params.filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'File not found',
      });
      return;
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    logger.error('File deletion failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete file',
    });
  }
});

export default router;
