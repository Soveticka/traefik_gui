import express from 'express';
import { auditLogService } from '../services/auditLogService';
import { ConfigService } from '../services/configService';
import { TraefikRouter, TraefikService } from '../types/traefik';
import { getActorIp, getExpectedRevision, handleRouteError, setRevisionHeader } from '../utils/routeUtils';
import { combinedSchema } from '../validation/schemas';

const router = express.Router();
const configService = new ConfigService();

interface CombinedRouterServiceData {
  routerName: string;
  serviceName: string;
  router: TraefikRouter;
  service: TraefikService;
}

// POST create router + service together
router.post('/router-service', async (req, res) => {
  try {
    const { error, value } = combinedSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const data: CombinedRouterServiceData = value;
    const expectedRevision = getExpectedRevision(req);

    const config = await configService.loadFullConfig();
    config.http.services[data.serviceName] = data.service;
    data.router.service = data.serviceName;
    config.http.routers[data.routerName] = data.router;

    await configService.saveFullConfig(config, expectedRevision);

    const currentRevision = await configService.getCurrentRevision();
    setRevisionHeader(res, currentRevision);

    auditLogService.log({
      action: 'combined.router-service.create',
      resourceName: `${data.routerName}:${data.serviceName}`,
      revision: currentRevision,
      actorIp: getActorIp(req),
      actorUserAgent: req.header('user-agent'),
    });

    res.json({
      message: 'Router and service created successfully',
      router: data.routerName,
      service: data.serviceName,
    });
  } catch (error) {
    handleRouteError(res, error, 'Failed to create router and service');
  }
});

export { router as combinedRouter };
