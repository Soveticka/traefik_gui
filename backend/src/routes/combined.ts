import express from 'express';
import Joi from 'joi';
import { ConfigService } from '../services/configService';
import { TraefikRouter, TraefikService } from '../types/traefik';

const router = express.Router();
const configService = new ConfigService();

interface CombinedRouterServiceData {
  routerName: string;
  serviceName: string;
  router: TraefikRouter;
  service: TraefikService;
}

const combinedSchema = Joi.object({
  routerName: Joi.string().required(),
  serviceName: Joi.string().required(),
  router: Joi.object({
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
  }).required(),
  service: Joi.object({
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
  }).required()
});

// POST create router + service together
router.post('/router-service', async (req, res) => {
  try {
    const { error, value } = combinedSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const data: CombinedRouterServiceData = value;

    // Load current config
    const config = await configService.loadFullConfig();

    // Add the service first
    config.http.services[data.serviceName] = data.service;

    // Ensure the router points to the service
    data.router.service = data.serviceName;
    
    // Add the router
    config.http.routers[data.routerName] = data.router;

    // Save the updated config
    await configService.saveFullConfig(config);

    res.json({ 
      message: 'Router and service created successfully',
      router: data.routerName,
      service: data.serviceName
    });
  } catch (error) {
    console.error('Error creating router + service:', error);
    res.status(500).json({ error: 'Failed to create router and service' });
  }
});

export { router as combinedRouter };