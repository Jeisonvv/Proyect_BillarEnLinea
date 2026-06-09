/**
 * middlewares/rateLimiter.middleware.ts — Límite de peticiones (Rate Limiting)
 *
 * Previene ataques de fuerza bruta y abuso de la API limitando cuántas
 * peticiones puede hacer una misma IP en una ventana de tiempo.
 *
 * Exporta dos limitadores:
 *   - generalLimiter : 100 peticiones / 15 min para la API en general
 *   - authLimiter    : 10 intentos / 15 min para rutas de login/registro
 */

import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
dotenv.config();
import type { NextFunction, Request, Response  } from "express";
import { logWarn } from '../utils/logger.js';

const BOT_API_KEY = process.env.BOT_API_KEY?.trim();

const AUTH_PATH_PREFIX = '/api/auth/';
const PUBLIC_READ_PATH_PREFIXES = [
  '/api/tournaments',
  '/api/activities',
  '/api/events',
  '/api/posts',
  '/api/products',
];

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getHeaderValue(req: Request, headerName: string) {
  const header = req.headers[headerName];

  if (Array.isArray(header)) {
    return header[0] ?? '';
  }

  return typeof header === 'string' ? header : '';
}

function extractForwardedForIp(req: Request) {
  const forwardedFor = getHeaderValue(req, 'x-forwarded-for');
  return forwardedFor.split(',')[0]?.trim() ?? '';
}

function resolveClientIp(req: Request) {
  const cfConnectingIp = getHeaderValue(req, 'cf-connecting-ip').trim();
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const realIp = getHeaderValue(req, 'x-real-ip').trim();
  if (realIp) {
    return realIp;
  }

  const forwardedClient = extractForwardedForIp(req);

  if (forwardedClient) {
    return forwardedClient;
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

function resolveRateLimitKey(req: Request) {
  const clientIp = resolveClientIp(req);
  const userAgent = getHeaderValue(req, 'user-agent').trim().slice(0, 120) || 'unknown-agent';

  // El user-agent reduce colisiones cuando varios usuarios salen por una misma IP (NAT/proxy).
  return `${clientIp}:${userAgent}`;
}

function isAuthPath(req: Request) {
  return req.path.startsWith(AUTH_PATH_PREFIX);
}

function isPublicReadPath(req: Request) {
  if (req.method !== 'GET') {
    return false;
  }

  return PUBLIC_READ_PATH_PREFIXES.some((prefix) => req.path.startsWith(prefix));
}

function createRateLimitHandler(message: string, limiter: 'general' | 'auth') {
  return (req: Request, res: Response) => {
    const rateLimitData = (req as Request & { rateLimit?: Record<string, unknown> }).rateLimit;

    logWarn('rate_limit_exceeded', {
      limiter,
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      ip: resolveClientIp(req),
      userAgent: getHeaderValue(req, 'user-agent'),
      forwardedFor: extractForwardedForIp(req),
      forwardedProto: getHeaderValue(req, 'x-forwarded-proto'),
      cfConnectingIp: getHeaderValue(req, 'cf-connecting-ip'),
      rateLimit: rateLimitData,
    });

    res.status(429).json({
      ok: false,
      message,
    });
  };
}

function isBotRequest(req: Request) {
  const botTokenHeader = req.headers["x-bot-token"];
  const botToken = Array.isArray(botTokenHeader) ? botTokenHeader[0] : botTokenHeader;

  if (!BOT_API_KEY || typeof botToken !== "string") {
    return false;
  }

  return botToken.trim() === BOT_API_KEY;
}

// ── Limitador general ─────────────────────────────────────────────────────────

const generalLimiterMessage = 'Demasiadas peticiones desde esta IP. Intenta de nuevo en 15 minutos.';

const publicReadLimiterMessage = 'Alto volumen de lecturas desde esta conexión. Intenta de nuevo en unos minutos.';

const publicReadLimiterInstance = rateLimit({
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS, 15 * 60 * 1000),
  max: parsePositiveInt(process.env.RATE_LIMIT_PUBLIC_MAX, 2000),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveRateLimitKey,
  handler: createRateLimitHandler(publicReadLimiterMessage, 'general'),
  skip: (req) => isBotRequest(req) || !isPublicReadPath(req),
});

const limiterInstance = rateLimit({
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_GENERAL_WINDOW_MS, 15 * 60 * 1000),
  max: parsePositiveInt(process.env.RATE_LIMIT_GENERAL_MAX, 500),
  standardHeaders: true,     // incluye los headers RateLimit-* en la respuesta
  legacyHeaders: false,      // deshabilita los headers X-RateLimit-* (obsoletos)
  keyGenerator: resolveRateLimitKey,
  handler: createRateLimitHandler(generalLimiterMessage, 'general'),
  skip: (req) => isBotRequest(req) || isAuthPath(req) || isPublicReadPath(req),
});

export const publicReadLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (isBotRequest(req)) {
    return next();
  }

  return publicReadLimiterInstance(req, res, next);
};


export const generalLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Si la petición trae la clave técnica del bot, no aplicar rate limit.
  if (isBotRequest(req)) {
    return next();
  }

  return limiterInstance(req, res, next);
};

// ── Limitador estricto para autenticación ─────────────────────────────────────
// Más restrictivo para dificultar ataques de fuerza bruta contra contraseñas

const authLimiterMessage = 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.';

const authLimiterInstance = rateLimit({
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 15 * 60 * 1000),
  max: parsePositiveInt(process.env.RATE_LIMIT_AUTH_MAX, 25),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: resolveRateLimitKey,
  skipSuccessfulRequests: true,
  handler: createRateLimitHandler(authLimiterMessage, 'auth'),
});

export const authLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (isBotRequest(req)) {
    return next();
  }

  return authLimiterInstance(req, res, next);
};

