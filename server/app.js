import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import apiRouter from './routes/index.js';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/v1', apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;

