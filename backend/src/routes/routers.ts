import express from 'express';
import Joi from 'joi';
import { ConfigService } from '../services/configService';

const router = express.Router();
const configService = new ConfigService();

const routerSchema = Joi.object({
  entryPoints: Joi.array().items(Joi.string()).required(),
  rule: Joi.string().required(),
  service: Joi.string().required(),
  tls: Joi.alternatives().try(
    Joi.boolean(),
    Joi.object({
      certResolver: Joi.string().optional()
    })
  ).optional(),
  middlewares: Joi.array().items(Joi.string()).optional()
});

// GET all routers
router.get('/', async (req, res) => {
  try {
    const routers = await configService.loadRouters();
    res.json(routers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load routers' });
  }
});

// GET specific router
router.get('/:name', async (req, res) => {
  try {
    const routers = await configService.loadRouters();
    const router = routers[req.params.name];
    
    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }
    
    res.json(router);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load router' });
  }
});

// POST create/update router
router.post('/:name', async (req, res) => {
  try {
    const { error, value } = routerSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    await configService.saveRouter(req.params.name, value);
    res.json({ message: 'Router saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save router' });
  }
});

// DELETE router
router.delete('/:name', async (req, res) => {
  try {
    await configService.deleteRouter(req.params.name);
    res.json({ message: 'Router deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete router' });
  }
});

export { router as routersRouter };