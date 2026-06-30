import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database';
import { authRouter } from './auth';
import { usersRouter } from './users';
import { matchingRouter } from './matching';
import { chatRouter } from './chat';

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  app.use(cors());
}

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/matching', matchingRouter);
app.use('/api/chat', chatRouter);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

if (isProduction) {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (isProduction) {
      console.log('Production mode: Frontend is served from /dist');
    }
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});