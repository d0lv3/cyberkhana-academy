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

/* Lab resources live in their own directory so index.ts can serve them under
 * their own rules: forced download, no sniffing. Images are embedded inline
 * and these never are. */
export const LAB_RESOURCES_DIR = path.join(UPLOADS_DIR, 'lab-resources');
if (!fs.existsSync(LAB_RESOURCES_DIR)) fs.mkdirSync(LAB_RESOURCES_DIR, { recursive: true });

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

/* ── Lab resources ──────────────────────────────────────────────────────────
 *
 * A lab's supporting files: a capture to open in Wireshark, a worksheet, a
 * config, a small archive of source. Deliberately a separate endpoint from the
 * image one, because almost every rule differs.
 *
 * The allowlist is by EXTENSION here rather than by mime, which reverses the
 * image endpoint's rule for a reason: browsers report `application/octet-stream`
 * for most of these (.pcapng and .conf have no registered type), so a mime
 * allowlist would reject exactly the files this exists to carry. The extension
 * is still never trusted as a filename — the stored name is random, and only
 * the matched extension from the allowlist is appended.
 *
 * What makes that safe is the serving side: index.ts sends everything under
 * /uploads/lab-resources as an octet-stream attachment with nosniff, so nothing
 * here can execute on our origin whatever it claims to be. HTML and SVG are
 * excluded anyway, as is anything Windows or macOS will run on a double click.
 *
 * Big disk images are out of scope on purpose. A 4 GB .ova does not belong on
 * an app server, and the studio tells creators to link those instead.
 */
const LAB_EXTENSIONS = new Set([
  'pdf', 'zip', 'gz', 'tar', 'txt', 'md', 'csv', 'json', 'log',
  'pcap', 'pcapng', 'cap', 'yaml', 'yml', 'conf', 'sh', 'py', 'sql',
]);

const MAX_LAB_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

/** The allowlisted extension for a client filename, or null if there isn't one. */
function labExtension(originalName: string): string | null {
  const ext = path.extname(originalName).slice(1).toLowerCase();
  return LAB_EXTENSIONS.has(ext) ? ext : null;
}

const labStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LAB_RESOURCES_DIR),
  filename: (_req, file, cb) => {
    const ext = labExtension(file.originalname);
    cb(null, `${crypto.randomBytes(16).toString('hex')}.${ext}`);
  },
});

const uploadLabResource = multer({
  storage: labStorage,
  limits: { fileSize: MAX_LAB_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (labExtension(file.originalname)) cb(null, true);
    else cb(new Error('UNSUPPORTED_TYPE'));
  },
});

/* ── POST /api/uploads/lab-resource ── creators/admins only; field name "file". */
router.post('/lab-resource', authenticate, requireRole('creator', 'admin'), (req: AuthRequest, res) => {
  uploadLabResource.single('file')(req, res, (err: unknown) => {
    if (err) {
      const message =
        err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large (max 25 MB). Link to anything bigger instead.'
          : err instanceof Error && err.message === 'UNSUPPORTED_TYPE'
          ? `That file type isn't allowed. Accepted: ${[...LAB_EXTENSIONS].join(', ')}`
          : 'Upload failed';
      res.status(400).json({ error: message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file provided (field name: file)' });
      return;
    }

    const base = process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${base}/uploads/lab-resources/${req.file.filename}`;

    logger.info('upload.lab_resource', {
      by: String(req.user!._id),
      file: req.file.filename,
      bytes: req.file.size,
    });

    /* The original name comes back so the studio can show it and store it with
     * the lab. It is display text only and never touches the filesystem. */
    res.json({
      url,
      name: req.file.originalname,
      kind: labExtension(req.file.originalname) ?? '',
      bytes: req.file.size,
    });
  });
});

export default router;
