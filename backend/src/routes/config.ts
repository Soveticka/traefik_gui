import express from 'express';
import { ConfigService } from '../services/configService';

const router = express.Router();
const configService = new ConfigService();

// GET full configuration
router.get('/', async (req, res) => {
  try {
    const config = await configService.loadFullConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

// POST split configuration into separate files
router.post('/split', async (req, res) => {
  try {
    const config = await configService.loadFullConfig();
    await configService.splitConfigIntoFiles(config);
    res.json({ message: 'Configuration split into separate files successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to split configuration' });
  }
});

export { router as configRouter };