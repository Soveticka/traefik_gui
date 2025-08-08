import express from 'express';
import Joi from 'joi';
import { ConfigService } from '../services/configService';

const router = express.Router();
const configService = new ConfigService();

const serviceSchema = Joi.object({
  loadBalancer: Joi.object({
    servers: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required()
      })
    ).required(),
    healthCheck: Joi.object({
      interval: Joi.string().optional(),
      path: Joi.string().optional(),
      timeout: Joi.string().optional()
    }).optional(),
    serversTransport: Joi.string().optional()
  }).required()
});

// GET all services
router.get('/', async (req, res) => {
  try {
    const services = await configService.loadServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load services' });
  }
});

// GET specific service
router.get('/:name', async (req, res) => {
  try {
    const services = await configService.loadServices();
    const service = services[req.params.name];
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load service' });
  }
});

// POST create/update service
router.post('/:name', async (req, res) => {
  try {
    const { error, value } = serviceSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    await configService.saveService(req.params.name, value);
    res.json({ message: 'Service saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save service' });
  }
});

// DELETE service
router.delete('/:name', async (req, res) => {
  try {
    await configService.deleteService(req.params.name);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export { router as servicesRouter };