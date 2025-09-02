import 'dotenv/config';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { SSR_AUTH_HEADER_TOKEN } from './src/app/shared/tokens';
// Add HTTPS & FS support
import https from 'node:https';
import fs from 'node:fs';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);
  // Ensure Express respects X-Forwarded-* headers when behind a proxy and sets req.protocol accordingly
  server.set('trust proxy', true);


  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  function parseCookies(cookieHeader?: string | string[]) {
    const raw = Array.isArray(cookieHeader) ? cookieHeader.join(';') : (cookieHeader || '');
    const out: Record<string, string> = {};
    raw.split(';').map(p => p.trim()).filter(Boolean).forEach(part => {
      const idx = part.indexOf('=');
      if (idx > -1) {
        const k = decodeURIComponent(part.substring(0, idx).trim());
        const v = decodeURIComponent(part.substring(idx + 1).trim());
        out[k] = v;
      }
    });
    return out;
  }

  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    let authHeader = headers['authorization'] ? String(headers['authorization']) : null;
    if (!authHeader) {
      const cookies = parseCookies(headers['cookie']);
      const token = cookies['auth_token'];
      if (token) authHeader = `Bearer ${token}`;
    }

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [
          { provide: APP_BASE_HREF, useValue: baseUrl },
          { provide: SSR_AUTH_HEADER_TOKEN, useValue: authHeader },
        ],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const useHttps = String(process.env['FRONTEND_USE_HTTPS'] || '').toLowerCase() === 'true';
  const keyPath = process.env['FRONTEND_SSL_KEY_PATH'];
  const certPath = process.env['FRONTEND_SSL_CERT_PATH'];

  const expressApp = app();

  if (useHttps && keyPath && certPath) {
    const resolvedKey = resolve(String(keyPath));
    const resolvedCert = resolve(String(certPath));

    const options: https.ServerOptions = {
      key: fs.readFileSync(resolvedKey),
      cert: fs.readFileSync(resolvedCert),
    };

    const httpsServer = https.createServer(options, expressApp);
    httpsServer.listen(port, () => {
      console.log(`Node Express server listening on https://localhost:${port}`);
    });
    return;
  }

  const httpServer = expressApp.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
