import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CyberKhana Academy API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
