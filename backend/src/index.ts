import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { routersRouter } from './routes/routers';
import { servicesRouter } from './routes/services';
import { middlewaresRouter } from './routes/middlewares';
import { configRouter } from './routes/config';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/routers', routersRouter);
app.use('/api/services', servicesRouter);
app.use('/api/middlewares', middlewaresRouter);
app.use('/api/config', configRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Traefik GUI Backend running on port ${PORT}`);
});