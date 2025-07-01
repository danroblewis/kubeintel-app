import { Router } from 'express';
import { KubernetesService } from '../services/kubernetes';
import { createError } from '../middleware/errorHandler';

const router = Router();
const k8sService = new KubernetesService();

// List resources
router.post('/resources/list', async (req, res, next) => {
  try {
    const { kubeconfigPath, context, namespace, resourceType } = req.body;
    
    if (!kubeconfigPath || !context || !resourceType) {
      throw createError('Missing required parameters', 400);
    }

    const resources = await k8sService.listResource({
      kubeconfigPath,
      context,
      namespace,
      resourceType,
    });

    res.json(resources);
  } catch (error) {
    next(error);
  }
});

// Get single resource
router.post('/resources/get', async (req, res, next) => {
  try {
    const { kubeconfigPath, context, namespace, resourceType, name } = req.body;
    
    if (!kubeconfigPath || !context || !resourceType || !name) {
      throw createError('Missing required parameters', 400);
    }

    const resource = await k8sService.getResource({
      kubeconfigPath,
      context,
      namespace,
      resourceType,
      name,
    });

    res.json(resource);
  } catch (error) {
    next(error);
  }
});

// Delete resource
router.post('/resources/delete', async (req, res, next) => {
  try {
    const { kubeconfigPath, context, namespace, resourceType, name } = req.body;
    
    if (!kubeconfigPath || !context || !resourceType || !name) {
      throw createError('Missing required parameters', 400);
    }

    await k8sService.deleteResource({
      kubeconfigPath,
      context,
      namespace,
      resourceType,
      name,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Scale resource
router.post('/resources/scale', async (req, res, next) => {
  try {
    const { kubeconfigPath, context, namespace, resourceType, name, replicas } = req.body;
    
    if (!kubeconfigPath || !context || !resourceType || !name || replicas === undefined) {
      throw createError('Missing required parameters', 400);
    }

    await k8sService.scaleResource({
      kubeconfigPath,
      context,
      namespace,
      resourceType,
      name,
      replicas,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Restart resource
router.post('/resources/restart', async (req, res, next) => {
  try {
    const { kubeconfigPath, context, namespace, resourceType, name } = req.body;
    
    if (!kubeconfigPath || !context || !resourceType || !name) {
      throw createError('Missing required parameters', 400);
    }

    await k8sService.restartResource({
      kubeconfigPath,
      context,
      namespace,
      resourceType,
      name,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// List resource events
router.post('/resources/events', async (req, res, next) => {
  try {
    const { kubeconfigPath, context, namespace, resourceType, name } = req.body;
    
    if (!kubeconfigPath || !context || !resourceType || !name) {
      throw createError('Missing required parameters', 400);
    }

    const events = await k8sService.listResourceEvents({
      kubeconfigPath,
      context,
      namespace,
      resourceType,
      name,
    });

    res.json(events);
  } catch (error) {
    next(error);
  }
});

// List namespaces
router.post('/namespaces', async (req, res, next) => {
  try {
    const { kubeconfigPath, context } = req.body;
    
    if (!kubeconfigPath || !context) {
      throw createError('Missing required parameters', 400);
    }

    const namespaces = await k8sService.listNamespaces({
      kubeconfigPath,
      context,
    });

    res.json(namespaces);
  } catch (error) {
    next(error);
  }
});

// Node operations
router.post('/nodes/cordon', async (req, res, next) => {
  try {
    const { kubeconfigPath, context, nodeName } = req.body;
    
    if (!kubeconfigPath || !context || !nodeName) {
      throw createError('Missing required parameters', 400);
    }

    await k8sService.cordonNode({
      kubeconfigPath,
      context,
      nodeName,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/nodes/uncordon', async (req, res, next) => {
  try {
    const { kubeconfigPath, context, nodeName } = req.body;
    
    if (!kubeconfigPath || !context || !nodeName) {
      throw createError('Missing required parameters', 400);
    }

    await k8sService.uncordonNode({
      kubeconfigPath,
      context,
      nodeName,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/nodes/drain', async (req, res, next) => {
  try {
    const { kubeconfigPath, context, nodeName } = req.body;
    
    if (!kubeconfigPath || !context || !nodeName) {
      throw createError('Missing required parameters', 400);
    }

    await k8sService.drainNode({
      kubeconfigPath,
      context,
      nodeName,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/nodes/pods', async (req, res, next) => {
  try {
    const { kubeconfigPath, context, nodeName } = req.body;
    
    if (!kubeconfigPath || !context || !nodeName) {
      throw createError('Missing required parameters', 400);
    }

    const pods = await k8sService.listPodsOnNode({
      kubeconfigPath,
      context,
      nodeName,
    });

    res.json(pods);
  } catch (error) {
    next(error);
  }
});

export { router as kubernetesRouter };