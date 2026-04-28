const WOMPI_ENV_KEYS = [
  'WOMPI_PUBLIC_KEY',
  'WOMPI_INTEGRITY_SECRET',
  'WOMPI_EVENTS_SECRET',
  'WOMPI_REDIRECT_URL',
  'WOMPI_RAFFLES_REDIRECT_URL',
  'WOMPI_TOURNAMENTS_REDIRECT_URL',
  'WOMPI_ORDERS_REDIRECT_URL',
] as const;

const CLOUDINARY_ENV_KEYS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

type RuntimeEnvShape = Partial<Record<string, string | undefined>>;

function hasNonEmptyValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export function parseTrustProxySetting(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return false;
  }

  const normalized = trimmed.toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  const numeric = Number(trimmed);
  if (Number.isInteger(numeric) && numeric >= 0) {
    return numeric;
  }

  return trimmed;
}

export function validateRuntimeEnv(env: RuntimeEnvShape = process.env) {
  const requiredVariables = [
    'MONGODB_URI',
    'JWT_SECRET',
  ] as const;

  const missingVariables = requiredVariables.filter((name) => !hasNonEmptyValue(env[name]));

  if (missingVariables.length > 0) {
    throw new Error(`Faltan variables de entorno requeridas: ${missingVariables.join(', ')}.`);
  }

  const wompiConfigRequested = WOMPI_ENV_KEYS.some((name) => hasNonEmptyValue(env[name]));
  if (!wompiConfigRequested) {
    return;
  }

  const requiredWompiVariables = [
    'WOMPI_PUBLIC_KEY',
    'WOMPI_INTEGRITY_SECRET',
    'WOMPI_EVENTS_SECRET',
  ] as const;

  const missingWompiVariables = requiredWompiVariables.filter((name) => !hasNonEmptyValue(env[name]));

  if (missingWompiVariables.length > 0) {
    throw new Error(
      `La configuración de Wompi está incompleta. Faltan: ${missingWompiVariables.join(', ')}.`,
    );
  }

  const cloudinaryConfigRequested = CLOUDINARY_ENV_KEYS.some((name) => hasNonEmptyValue(env[name]));
  if (!cloudinaryConfigRequested) {
    return;
  }

  const missingCloudinaryVariables = CLOUDINARY_ENV_KEYS.filter((name) => !hasNonEmptyValue(env[name]));
  if (missingCloudinaryVariables.length > 0) {
    throw new Error(
      `La configuración de Cloudinary está incompleta. Faltan: ${missingCloudinaryVariables.join(', ')}.`,
    );
  }
}