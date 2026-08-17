import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import apiRouter from './routes/index.js';

const app = express();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: clientUrl }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/v1', apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
