import express from 'express';
import { combinedRouter } from '../combined';
import { configRouter } from '../config';
import { middlewaresRouter } from '../middlewares';
import { routersRouter } from '../routers';
import { servicesRouter } from '../services';

const apiV1Router = express.Router();

apiV1Router.use('/routers', routersRouter);
apiV1Router.use('/services', servicesRouter);
apiV1Router.use('/middlewares', middlewaresRouter);
apiV1Router.use('/config', configRouter);
apiV1Router.use('/combined', combinedRouter);

export { apiV1Router };
