import express from 'express';
import YAML from 'yaml';
import { auditLogService } from '../services/auditLogService';
import { ConfigService } from '../services/configService';
import { buildSimpleLineDiff } from '../services/diffService';
import { getActorIp, getExpectedRevision, handleRouteError, setRevisionHeader } from '../utils/routeUtils';

const router = express.Router();
const configService = new ConfigService();

// GET full configuration
router.get('/', async (_req, res) => {
  try {
    const config = await configService.loadFullConfig();
    setRevisionHeader(res, configService.getRevision(config));
    res.json(config);
  } catch (error) {
    handleRouteError(res, error, 'Failed to load configuration');
  }
});

// GET recent audit log entries with optional filters
router.get('/audit', (req, res) => {
  try {
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;
    const resource = typeof req.query.resource === 'string' ? req.query.resource : undefined;
    const since = typeof req.query.since === 'string' ? req.query.since : undefined;
    const rawLimit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;
    const limit = Number.isFinite(rawLimit) ? rawLimit : undefined;

    const entries = auditLogService.list({ action, resource, since, limit });
    res.json({ entries });
  } catch (error) {
    handleRouteError(res, error, 'Failed to load audit events');
  }
});

// POST dry-run a proposed config and return diff/revision without writing
router.post('/dry-run', async (req, res) => {
  try {
    const proposedInput = req.body?.config ?? req.body;
    const proposedConfig = configService.normalizeConfig(proposedInput);
    const currentConfig = await configService.loadFullConfig();

    const currentRevision = configService.getRevision(currentConfig);
    const proposedRevision = configService.getRevision(proposedConfig);

    const currentYaml = YAML.stringify(currentConfig, { indent: 2 });
    const proposedYaml = YAML.stringify(proposedConfig, { indent: 2 });
    const diff = buildSimpleLineDiff(currentYaml, proposedYaml);

    setRevisionHeader(res, currentRevision);

    res.json({
      currentRevision,
      proposedRevision,
      hasChanges: currentRevision !== proposedRevision,
      diff,
    });
  } catch (error) {
    handleRouteError(res, error, 'Failed to dry-run configuration');
  }
});

// POST split configuration into separate files
router.post('/split', async (req, res) => {
  try {
    const expectedRevision = getExpectedRevision(req);
    const config = await configService.loadFullConfig();
    await configService.splitConfigIntoFiles(config, expectedRevision);

    const currentRevision = await configService.getCurrentRevision();
    setRevisionHeader(res, currentRevision);

    auditLogService.log({
      action: 'config.split',
      revision: currentRevision,
      actorIp: getActorIp(req),
      actorUserAgent: req.header('user-agent'),
    });

    res.json({ message: 'Configuration split into separate files successfully' });
  } catch (error) {
    handleRouteError(res, error, 'Failed to split configuration');
  }
});

export { router as configRouter };
