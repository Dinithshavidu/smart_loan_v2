import express from 'express';
import path from 'path';
import {createServer as createViteServer} from 'vite';

import {JWT_SECRET, PORT} from './backend/config/env';
import {db, initializeDatabase, seedSuperAdmin} from './backend/db/index';
import {registerApiRoutes} from './backend/routes/api';

async function startServer() {
  initializeDatabase();
  seedSuperAdmin();

  const app = express();

  app.use(express.json());

  registerApiRoutes(app, {db, jwtSecret: JWT_SECRET});

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
