import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary';

const DEFAULT_UPLOAD_FOLDER = 'billar-en-linea';

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function getCloudinaryCredentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!hasValue(cloudName) || !hasValue(apiKey) || !hasValue(apiSecret)) {
    throw new Error('Cloudinary no está configurado. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.');
  }

  return {
    cloudName: cloudName as string,
    apiKey: apiKey as string,
    apiSecret: apiSecret as string,
  };
}

let isConfigured = false;

function ensureCloudinaryConfigured() {
  if (isConfigured) {
    return;
  }

  const credentials = getCloudinaryCredentials();
  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  });
  isConfigured = true;
}

function sanitizeFolder(folder?: string) {
  if (!folder) {
    return DEFAULT_UPLOAD_FOLDER;
  }

  return folder
    .trim()
    .replace(/\\+/g, '/')
    .replace(/^\/+|\/+$/g, '') || DEFAULT_UPLOAD_FOLDER;
}

function sanitizePublicId(publicId?: string) {
  if (!publicId) {
    return undefined;
  }

  return publicId
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9/_-]+/g, '') || undefined;
}

function normalizeTags(tags?: string) {
  if (!tags) {
    return undefined;
  }

  const parsed = tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : undefined;
}

@Injectable()
export class UploadsNestService {
  async uploadImage(
    file: Express.Multer.File,
    options?: {
      folder?: string;
      publicId?: string;
      overwrite?: boolean;
      tags?: string;
    },
  ) {
    ensureCloudinaryConfigured();

    const publicId = sanitizePublicId(options?.publicId);
    const tags = normalizeTags(options?.tags);

    const uploadOptions: UploadApiOptions = {
      resource_type: 'image',
      folder: sanitizeFolder(options?.folder),
      overwrite: options?.overwrite ?? false,
      use_filename: !options?.publicId,
      unique_filename: !options?.publicId,
      invalidate: true,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (tags) {
      uploadOptions.tags = tags;
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error('Cloudinary no devolvió respuesta al subir la imagen.'));
          return;
        }

        resolve(response);
      });

      stream.end(file.buffer);
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      originalFilename: file.originalname,
      folder: result.folder,
      resourceType: result.resource_type,
    };
  }
}