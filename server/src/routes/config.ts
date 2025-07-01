import { Router } from 'express';
import { ConfigService } from '../services/config';
import { createError } from '../middleware/errorHandler';

const router = Router();
const configService = new ConfigService();

// Read kubeconfig
router.post('/kubeconfig/read', async (req, res, next) => {
  try {
    const { kubeconfigPath } = req.body;
    
    if (!kubeconfigPath) {
      throw createError('Kubeconfig path is required', 400);
    }

    const config = await configService.readKubeconfig(kubeconfigPath);
    res.json(config);
  } catch (error) {
    next(error);
  }
});

// Get cluster info
router.post('/cluster/info', async (req, res, next) => {
  try {
    const { kubeconfigPath, context } = req.body;
    
    if (!kubeconfigPath || !context) {
      throw createError('Kubeconfig path and context are required', 400);
    }

    const info = await configService.getClusterInfo(kubeconfigPath, context);
    res.json(info);
  } catch (error) {
    next(error);
  }
});

// Check kubectl installation
router.get('/kubectl/check', async (req, res, next) => {
  try {
    const isInstalled = await configService.isKubectlInstalled();
    res.json({ installed: isInstalled });
  } catch (error) {
    next(error);
  }
});

export { router as configRouter };