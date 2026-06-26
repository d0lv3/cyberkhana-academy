import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/* Allowlisted image types only. SVG is deliberately excluded — it can carry
 * scripts and is an XSS vector when served from our origin. The extension is
 * derived from the VERIFIED mime type, never from the client's filename. */
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = EXT_BY_MIME[file.mimetype];
    cb(null, `${crypto.randomBytes(16).toString('hex')}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) cb(null, true);
    else cb(new Error('UNSUPPORTED_TYPE'));
  },
});

/* ── POST /api/uploads ── creators/admins only; field name "image". */
router.post('/', authenticate, requireRole('creator', 'admin'), (req: AuthRequest, res) => {
  upload.single('image')(req, res, (err: unknown) => {
    if (err) {
      const message =
        err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
          ? 'Image too large (max 2 MB)'
          : err instanceof Error && err.message === 'UNSUPPORTED_TYPE'
          ? 'Only PNG, JPEG, WebP and GIF images are allowed'
          : 'Upload failed';
      res.status(400).json({ error: message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No image provided (field name: image)' });
      return;
    }

    // Absolute URL so it can be embedded straight into markdown.
    const base = process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${base}/uploads/${req.file.filename}`;

    logger.info('upload.image', {
      by: String(req.user!._id),
      file: req.file.filename,
      bytes: req.file.size,
    });
    res.json({ url });
  });
});

export default router;
