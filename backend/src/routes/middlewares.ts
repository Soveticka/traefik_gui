import express from 'express';
import Joi from 'joi';
import { ConfigService } from '../services/configService';

const router = express.Router();
const configService = new ConfigService();

const middlewareSchema = Joi.object({
  errors: Joi.object({
    query: Joi.string().required(),
    service: Joi.string().required(),
    status: Joi.array().items(Joi.string()).required()
  }).optional(),
  rateLimit: Joi.object({
    average: Joi.number().required(),
    burst: Joi.number().required()
  }).optional(),
  headers: Joi.object({
    customRequestHeaders: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    customResponseHeaders: Joi.object().pattern(Joi.string(), Joi.string()).optional()
  }).optional(),
  redirectRegex: Joi.object({
    permanent: Joi.boolean().required(),
    regex: Joi.string().required(),
    replacement: Joi.string().required()
  }).optional()
});

// GET all middlewares
router.get('/', async (req, res) => {
  try {
    const middlewares = await configService.loadMiddlewares();
    res.json(middlewares);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load middlewares' });
  }
});

// GET specific middleware
router.get('/:name', async (req, res) => {
  try {
    const middlewares = await configService.loadMiddlewares();
    const middleware = middlewares[req.params.name];
    
    if (!middleware) {
      return res.status(404).json({ error: 'Middleware not found' });
    }
    
    res.json(middleware);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load middleware' });
  }
});

// POST create/update middleware
router.post('/:name', async (req, res) => {
  try {
    const { error, value } = middlewareSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    await configService.saveMiddleware(req.params.name, value);
    res.json({ message: 'Middleware saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save middleware' });
  }
});

// DELETE middleware
router.delete('/:name', async (req, res) => {
  try {
    await configService.deleteMiddleware(req.params.name);
    res.json({ message: 'Middleware deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete middleware' });
  }
});

export { router as middlewaresRouter };