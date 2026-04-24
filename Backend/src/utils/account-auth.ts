import { createHash, randomBytes } from 'node:crypto';

const RESET_TOKEN_EXPIRY_MS = 1000 * 60 * 60;

export function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

export function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createResetToken() {
  const token = randomBytes(32).toString('hex');

  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
  };
}

export function buildPasswordResetUrl(token: string, contextLabel = 'recuperación') {
  const configuredBaseUrl = process.env.PASSWORD_RESET_URL_BASE?.trim();

  if (configuredBaseUrl) {
    const url = new URL(configuredBaseUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }

  const frontendUrl = process.env.FRONTEND_URL?.trim() ?? process.env.ALLOWED_ORIGINS?.split(',')[0]?.trim();

  if (!frontendUrl) {
    throw new Error(`No se encontró FRONTEND_URL o PASSWORD_RESET_URL_BASE para construir el link de ${contextLabel}.`);
  }

  const url = new URL('/reset-password', frontendUrl);
  url.searchParams.set('token', token);
  return url.toString();
}