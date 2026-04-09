import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiV1Router } from './routes/v1';

const app = express();
const PORT = process.env.PORT || 3001;
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN;
const ALLOW_UNAUTHENTICATED_API = process.env.ALLOW_UNAUTHENTICATED_API === 'true';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!ALLOW_UNAUTHENTICATED_API && !API_AUTH_TOKEN) {
  throw new Error(
    'API_AUTH_TOKEN must be set (or explicitly set ALLOW_UNAUTHENTICATED_API=true for local development).'
  );
}

const requireApiAuth: express.RequestHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (ALLOW_UNAUTHENTICATED_API) {
    return next();
  }

  const authHeader = req.header('authorization');
  const apiKeyHeader = req.header('x-api-key');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const providedToken = bearerToken || apiKeyHeader;

  if (!providedToken || providedToken !== API_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());
app.use('/api', requireApiAuth);

// Versioned API (primary)
app.use('/api/v1', apiV1Router);

// Legacy compatibility routes
app.use('/api', apiV1Router);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Traefik GUI Backend running on port ${PORT}`);
});
