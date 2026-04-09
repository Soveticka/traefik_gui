import express from 'express';
import { auditLogService } from '../services/auditLogService';
import { ConfigService } from '../services/configService';
import { getActorIp, getExpectedRevision, handleRouteError, setRevisionHeader } from '../utils/routeUtils';
import { middlewareSchema } from '../validation/schemas';

const router = express.Router();
const configService = new ConfigService();

// GET all middlewares
router.get('/', async (_req, res) => {
  try {
    const config = await configService.loadFullConfig();
    setRevisionHeader(res, configService.getRevision(config));
    res.json(config.http.middlewares || {});
  } catch (error) {
    handleRouteError(res, error, 'Failed to load middlewares');
  }
});

// GET specific middleware
router.get('/:name', async (req, res) => {
  try {
    const config = await configService.loadFullConfig();
    setRevisionHeader(res, configService.getRevision(config));

    const middleware = config.http.middlewares[req.params.name];
    if (!middleware) {
      return res.status(404).json({ error: 'Middleware not found' });
    }

    res.json(middleware);
  } catch (error) {
    handleRouteError(res, error, 'Failed to load middleware');
  }
});

// POST create/update middleware
router.post('/:name', async (req, res) => {
  try {
    const { error, value } = middlewareSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const expectedRevision = getExpectedRevision(req);
    await configService.saveMiddleware(req.params.name, value, expectedRevision);

    const currentRevision = await configService.getCurrentRevision();
    setRevisionHeader(res, currentRevision);

    auditLogService.log({
      action: 'middleware.save',
      resourceName: req.params.name,
      revision: currentRevision,
      actorIp: getActorIp(req),
      actorUserAgent: req.header('user-agent'),
    });

    res.json({ message: 'Middleware saved successfully' });
  } catch (error) {
    handleRouteError(res, error, 'Failed to save middleware');
  }
});

// DELETE middleware
router.delete('/:name', async (req, res) => {
  try {
    const expectedRevision = getExpectedRevision(req);
    await configService.deleteMiddleware(req.params.name, expectedRevision);

    const currentRevision = await configService.getCurrentRevision();
    setRevisionHeader(res, currentRevision);

    auditLogService.log({
      action: 'middleware.delete',
      resourceName: req.params.name,
      revision: currentRevision,
      actorIp: getActorIp(req),
      actorUserAgent: req.header('user-agent'),
    });

    res.json({ message: 'Middleware deleted successfully' });
  } catch (error) {
    handleRouteError(res, error, 'Failed to delete middleware');
  }
});

export { router as middlewaresRouter };
