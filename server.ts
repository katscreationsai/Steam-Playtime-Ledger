import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeImportedGamesJson,
  analyzeSteamPlaytime,
  deriveSteamIdentifiers,
  parseSteamInput,
} from './server/steamService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health & server capability check (never exposes secret values)
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      apiKeyConfigured: Boolean(process.env.STEAM_API_KEY && process.env.STEAM_API_KEY.trim()),
    });
  });

  // Pure identifier parser & format converter
  app.get('/api/steam/convert-id', (req, res) => {
    try {
      const query = typeof req.query.query === 'string' ? req.query.query : '';
      const parsed = parseSteamInput(query);
      if (!parsed.steamId64) {
        res.json({
          parsed,
          identifiers: null,
        });
        return;
      }
      const identifiers = deriveSteamIdentifiers(
        parsed.steamId64,
        parsed.raw,
        parsed.format,
        parsed.vanityName
      );
      res.json({ parsed, identifiers });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Invalid Steam identifier.',
      });
    }
  });

  // Main Steam playtime analysis route
  app.post('/api/steam/analyze', async (req, res) => {
    try {
      const query = typeof req.body?.query === 'string' ? req.body.query : '';
      const result = await analyzeSteamPlaytime(query, process.env.STEAM_API_KEY);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze Steam playtime.';
      res.status(400).json({ error: message });
    }
  });

  // Offline / raw GetOwnedGames JSON parser route
  app.post('/api/steam/parse-json', (req, res) => {
    try {
      const payload = req.body?.payload;
      const label =
        typeof req.body?.label === 'string' && req.body.label.trim()
          ? req.body.label.trim()
          : 'Imported Steam Library';
      const result = analyzeImportedGamesJson(payload, label);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse Steam JSON.';
      res.status(400).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Playtime Ledger listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
