import { Router } from 'express';
import { CredentialsService } from '../services/credentials';
import { createError } from '../middleware/errorHandler';

const router = Router();
const credentialsService = new CredentialsService();

// Set secret
router.post('/set', async (req, res, next) => {
  try {
    const { key, value } = req.body;
    
    if (!key || !value) {
      throw createError('Key and value are required', 400);
    }

    await credentialsService.setSecret(key, value);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get secret
router.post('/get', async (req, res, next) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      throw createError('Key is required', 400);
    }

    const value = await credentialsService.getSecret(key);
    res.json({ value });
  } catch (error) {
    next(error);
  }
});

// Remove secret
router.post('/remove', async (req, res, next) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      throw createError('Key is required', 400);
    }

    await credentialsService.removeSecret(key);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as credentialsRouter };