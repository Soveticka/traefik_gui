import express from 'express';
import { auditLogService } from '../services/auditLogService';
import { ConfigService } from '../services/configService';
import { getActorIp, getExpectedRevision, handleRouteError, setRevisionHeader } from '../utils/routeUtils';
import { serviceSchema } from '../validation/schemas';

const router = express.Router();
const configService = new ConfigService();

// GET all services
router.get('/', async (_req, res) => {
  try {
    const config = await configService.loadFullConfig();
    setRevisionHeader(res, configService.getRevision(config));
    res.json(config.http.services || {});
  } catch (error) {
    handleRouteError(res, error, 'Failed to load services');
  }
});

// GET specific service
router.get('/:name', async (req, res) => {
  try {
    const config = await configService.loadFullConfig();
    setRevisionHeader(res, configService.getRevision(config));

    const service = config.http.services[req.params.name];
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    handleRouteError(res, error, 'Failed to load service');
  }
});

// POST create/update service
router.post('/:name', async (req, res) => {
  try {
    const { error, value } = serviceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const expectedRevision = getExpectedRevision(req);
    await configService.saveService(req.params.name, value, expectedRevision);

    const currentRevision = await configService.getCurrentRevision();
    setRevisionHeader(res, currentRevision);

    auditLogService.log({
      action: 'service.save',
      resourceName: req.params.name,
      revision: currentRevision,
      actorIp: getActorIp(req),
      actorUserAgent: req.header('user-agent'),
    });

    res.json({ message: 'Service saved successfully' });
  } catch (error) {
    handleRouteError(res, error, 'Failed to save service');
  }
});

// DELETE service
router.delete('/:name', async (req, res) => {
  try {
    const expectedRevision = getExpectedRevision(req);
    await configService.deleteService(req.params.name, expectedRevision);

    const currentRevision = await configService.getCurrentRevision();
    setRevisionHeader(res, currentRevision);

    auditLogService.log({
      action: 'service.delete',
      resourceName: req.params.name,
      revision: currentRevision,
      actorIp: getActorIp(req),
      actorUserAgent: req.header('user-agent'),
    });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    handleRouteError(res, error, 'Failed to delete service');
  }
});

export { router as servicesRouter };
