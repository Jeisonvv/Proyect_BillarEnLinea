import { v2 as cloudinary } from 'cloudinary';
import { logWarn, logError } from './logger.js';

let isConfigured = false;

function ensureConfigured() {
  if (isConfigured) return true;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  isConfigured = true;
  return true;
}

/**
 * Extrae el public_id de una URL de Cloudinary.
 * Formato típico: https://res.cloudinary.com/<cloud>/image/upload/[v123/]<folder>/<publicId>.<ext>
 */
export function extractCloudinaryPublicId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('res.cloudinary.com') && !url.includes('/upload/')) return null;

  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    if (!match || !match[1]) return null;
    return match[1];
  } catch {
    return null;
  }
}

/**
 * Elimina una imagen en Cloudinary a partir de su URL.
 * No lanza errores: registra y continúa para no bloquear flujos de eliminación.
 */
export async function deleteCloudinaryImageByUrl(url?: string | null): Promise<boolean> {
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;

  if (!ensureConfigured()) {
    logWarn('[cloudinary] Credenciales no configuradas; se omite eliminación de imagen.');
    return false;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    });
    if (result?.result !== 'ok' && result?.result !== 'not found') {
      logWarn(`[cloudinary] Resultado inesperado al eliminar ${publicId}`, { result: result?.result });
      return false;
    }
    return true;
  } catch (error) {
    logError(`[cloudinary] Error eliminando imagen ${publicId}`, { message: (error as Error).message });
    return false;
  }
}
