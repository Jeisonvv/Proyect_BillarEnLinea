/**
 * middlewares/errorHandler.middleware.ts — Manejador global de errores
 *
 * Captura cualquier error que llegue con next(error) o que sea lanzado
 * en middlewares asíncronos.
 *
 * Ventajas de seguridad:
 *   - En producción no expone el stack trace al cliente
 *   - Centraliza los logs de errores inesperados
 *   - Evita que el servidor quede colgado sin responder
 */
import type { Request, Response, NextFunction } from "express";
import { logError } from '../utils/logger.js';

export function errorHandler(
  err: Error & { status?: number; code?: number },
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const isDev = process.env.NODE_ENV !== "production";

  // Log completo solo en servidor, nunca en la respuesta al cliente (producción)
  logError('request_error', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    status: err.status,
    code: err.code,
    error: err.message,
    ...(isDev && err.stack ? { stack: err.stack } : {}),
  });

  // Determinar el código HTTP
  const status = err.status ?? (err.code === 11000 ? 409 : 500);

  res.status(status).json({
    ok: false,
    message: isDev
      ? err.message
      : status < 500
        ? err.message               // Errores 4xx son informativos al cliente
        : "Error interno del servidor.", // Errores 5xx no se exponen
    ...(isDev && { stack: err.stack }),
  });
}
