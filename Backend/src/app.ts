/**
 * app.ts — Pipeline HTTP compartido usado por Nest mediante ExpressAdapter.
 *
 * Aquí solo viven middlewares transversales y la ruta raíz de salud.
 */
import express, { type Application, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import { sanitize as mongoSanitize } from 'express-mongo-sanitize';
import { getMongoConnectionStatus } from './db/connection.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { logInfo } from './utils/logger.js';
import { parseTrustProxySetting } from './utils/runtime-env.js';

function getMorganTokenValue(
  tokens: morgan.TokenIndexer<Request, Response>,
  tokenName: string,
  req: Request,
  res: Response,
  argument?: string,
) {
  const token = tokens[tokenName];
  if (!token) {
    return undefined;
  }

  return argument === undefined ? token(req, res) : token(req, res, argument);
}

export function createExpressApp(): Application {
  const app: Application = express();

  app.set('trust proxy', parseTrustProxySetting(process.env.TRUST_PROXY));

  app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id']?.toString().trim() || randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  });

  // ── Seguridad: cabeceras HTTP ─────────────────────────────────────────────
  app.use(helmet());

  // ── Seguridad: CORS ──────────────────────────────────────────────────────
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  }));

  // ── Seguridad: Rate Limiting general ─────────────────────────────────────
  app.use('/api', generalLimiter);

  // ── Parseo de body ────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ── Seguridad: sanitización MongoDB ──────────────────────────────────────
  app.use((req, _res, next) => {
    if (req.body) req.body = mongoSanitize(req.body);
    if (req.params) req.params = mongoSanitize(req.params) as Record<string, string>;
    next();
  });

  // ── Logs de peticiones ────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    morgan.token('request-id', (req) => (req as Request).requestId ?? '-');
    app.use(morgan((tokens, req, res) => JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'http_request',
      context: {
        requestId: getMorganTokenValue(tokens, 'request-id', req, res) ?? '-',
        method: getMorganTokenValue(tokens, 'method', req, res) ?? '',
        url: getMorganTokenValue(tokens, 'url', req, res) ?? '',
        statusCode: Number(getMorganTokenValue(tokens, 'status', req, res) ?? 0),
        responseTimeMs: Number(getMorganTokenValue(tokens, 'response-time', req, res) ?? 0),
        contentLength: getMorganTokenValue(tokens, 'res', req, res, 'content-length') ?? '0',
        userAgent: getMorganTokenValue(tokens, 'req', req, res, 'user-agent') ?? '',
        remoteAddress: getMorganTokenValue(tokens, 'remote-addr', req, res) ?? '',
      },
    })));
  }

  // ── Rutas ─────────────────────────────────────────────────────────────────
  app.get('/', (_req: Request, res: Response) => {
    res.json({ ok: true, message: 'API Billar en Línea funcionando 🎱' });
  });

  app.get('/health', (req: Request, res: Response) => {
    const mongo = getMongoConnectionStatus();
    const healthy = mongo === 'connected';

    logInfo('healthcheck', {
      requestId: req.requestId,
      mongo,
      healthy,
    });

    res.status(healthy ? 200 : 503).json({
      ok: healthy,
      status: healthy ? 'ok' : 'degraded',
      service: 'backendbillarenlinea',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        mongo,
      },
    });
  });

  // ── Manejo global de errores ──────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
