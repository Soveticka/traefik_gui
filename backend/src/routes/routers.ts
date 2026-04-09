import express from 'express';
import { auditLogService } from '../services/auditLogService';
import { ConfigService } from '../services/configService';
import { getActorIp, getExpectedRevision, handleRouteError, setRevisionHeader } from '../utils/routeUtils';
import { routerSchema } from '../validation/schemas';

const router = express.Router();
const configService = new ConfigService();

// GET all routers
router.get('/', async (_req, res) => {
  try {
    const config = await configService.loadFullConfig();
    setRevisionHeader(res, configService.getRevision(config));
    res.json(config.http.routers || {});
  } catch (error) {
    handleRouteError(res, error, 'Failed to load routers');
  }
});

// GET specific router
router.get('/:name', async (req, res) => {
  try {
    const config = await configService.loadFullConfig();
    setRevisionHeader(res, configService.getRevision(config));

    const foundRouter = config.http.routers[req.params.name];
    if (!foundRouter) {
      return res.status(404).json({ error: 'Router not found' });
    }

    res.json(foundRouter);
  } catch (error) {
    handleRouteError(res, error, 'Failed to load router');
  }
});

// POST create/update router
router.post('/:name', async (req, res) => {
  try {
    const { error, value } = routerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const expectedRevision = getExpectedRevision(req);
    await configService.saveRouter(req.params.name, value, expectedRevision);

    const currentRevision = await configService.getCurrentRevision();
    setRevisionHeader(res, currentRevision);

    auditLogService.log({
      action: 'router.save',
      resourceName: req.params.name,
      revision: currentRevision,
      actorIp: getActorIp(req),
      actorUserAgent: req.header('user-agent'),
    });

    res.json({ message: 'Router saved successfully' });
  } catch (error) {
    handleRouteError(res, error, 'Failed to save router');
  }
});

// DELETE router
router.delete('/:name', async (req, res) => {
  try {
    const expectedRevision = getExpectedRevision(req);
    await configService.deleteRouter(req.params.name, expectedRevision);

    const currentRevision = await configService.getCurrentRevision();
    setRevisionHeader(res, currentRevision);

    auditLogService.log({
      action: 'router.delete',
      resourceName: req.params.name,
      revision: currentRevision,
      actorIp: getActorIp(req),
      actorUserAgent: req.header('user-agent'),
    });

    res.json({ message: 'Router deleted successfully' });
  } catch (error) {
    handleRouteError(res, error, 'Failed to delete router');
  }
});

export { router as routersRouter };
