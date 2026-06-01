import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import RevokedToken from '../../models/revoked-token.model.js';
import { Channel } from '../../models/enums.js';
import User from '../../models/user.model.js';
import { UploadsNestService } from '../uploads/uploads.service.js';
import { isMailConfigured, sendPasswordResetEmail } from '../../services/mail.service.js';
import { createWebUserService } from '../../services/user.service.js';
import { buildPasswordResetUrl, createResetToken, hashResetToken, normalizeEmail } from '../../utils/account-auth.js';
import { extractAuthToken } from '../../utils/auth-token.js';
import type { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateProfileDto } from './dto/auth.dto.js';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '30d';

@Injectable()
export class AuthNestService {
  constructor(private readonly uploadsService: UploadsNestService) {}

  async register(data: RegisterDto) {
    return createWebUserService(data);
  }

  async getCurrentUser(userId: string) {
    const user = await User.findOne({
      _id: userId,
      deletedAt: { $exists: false },
    });

    if (!user) {
      const error = new Error('Usuario autenticado no encontrado.') as Error & { status?: number };
      error.status = 404;
      throw error;
    }

    return this.buildAuthenticatedUserPayload(user);
  }

  async updateCurrentUser(userId: string, data: UpdateProfileDto) {
    const user = await User.findOne({
      _id: userId,
      deletedAt: { $exists: false },
    });

    if (!user) {
      const error = new Error('Usuario autenticado no encontrado.') as Error & { status?: number };
      error.status = 404;
      throw error;
    }

    const nextName = typeof data.name === 'string' ? data.name.trim() : undefined;
    const nextPhone = typeof data.phone === 'string' ? data.phone.trim() : undefined;
    const nextCity = typeof data.ciudad === 'string' ? data.ciudad.trim() : undefined;
    const nextAddress = typeof data.direccion === 'string' ? data.direccion.trim() : undefined;
    if (nextName !== undefined) {
      user.name = nextName;
    }

    if (nextPhone !== undefined) {
      if (!nextPhone) {
        throw new Error('El teléfono no puede estar vacío.');
      }

      const existingUser = await User.findOne({
        _id: { $ne: userId },
        phone: nextPhone,
        deletedAt: { $exists: false },
      }).lean();

      if (existingUser) {
        throw new Error('Este teléfono ya está registrado.');
      }

      user.phone = nextPhone;
    }

    if (nextCity !== undefined) {
      user.ciudad = nextCity;
    }

    if (nextAddress !== undefined) {
      if (nextAddress) {
        user.direccion = nextAddress;
      } else {
        user.set('direccion', undefined);
      }
    }

    if (typeof data.email === 'string') {
      const normalizedEmail = normalizeEmail(data.email);
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        'webAuth.email': normalizedEmail,
        deletedAt: { $exists: false },
      }).lean();

      if (existingUser) {
        throw new Error('Este email ya está registrado.');
      }

      if (!user.webAuth) {
        user.webAuth = { emailVerified: false };
      }

      user.webAuth.email = normalizedEmail;

      const webIdentity = user.identities.find((identity) => identity.provider === 'WEB');
      if (webIdentity) {
        webIdentity.providerId = normalizedEmail;
      } else {
        user.identities.push({ provider: Channel.WEB, providerId: normalizedEmail });
      }
    }

    await user.save();

    return this.buildAuthenticatedUserPayload(user);
  }

  async uploadCurrentUserAvatar(userId: string, file: Express.Multer.File) {
    const user = await User.findOne({
      _id: userId,
      deletedAt: { $exists: false },
    });

    if (!user) {
      const error = new Error('Usuario autenticado no encontrado.') as Error & { status?: number };
      error.status = 404;
      throw error;
    }

    const previousAvatarUrl = user.avatarUrl;
    const upload = await this.uploadsService.uploadImage(file, {
      folder: 'billar-en-linea/usuarios/avatares',
      publicId: `user-${String(user._id)}`,
      overwrite: true,
      tags: 'usuarios,perfil,avatar',
    });

    user.avatarUrl = upload.url;
    await user.save();

    if (previousAvatarUrl && previousAvatarUrl !== upload.url) {
      await this.uploadsService.deleteImageByUrl(previousAvatarUrl);
    }

    return this.buildAuthenticatedUserPayload(user);
  }

  async login(data: LoginDto) {
    if (!data.email || !data.password) {
      throw new Error('email y password son obligatorios.');
    }

    const authResult = await this.authenticateWebCredentials(data.email, data.password);
    if ('error' in authResult) {
      throw new Error(authResult.error);
    }

    const signedToken = this.signAuthToken(authResult.user);
    if (!signedToken.ok) {
      const error = new Error(signedToken.error) as Error & { status?: number };
      error.status = signedToken.status;
      throw error;
    }

    return {
      token: signedToken.token,
      payload: this.buildAuthenticatedUserPayload(authResult.user),
    };
  }

  async logout(req: Request) {
    const token = extractAuthToken(req);

    if (!token) {
      return { ok: true, message: 'Sesión cerrada correctamente.' };
    }

    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;
      if (!decoded?.exp) {
        return { ok: true, message: 'Sesión cerrada correctamente.' };
      }

      await RevokedToken.updateOne(
        { token },
        { $setOnInsert: { token, expiresAt: new Date(decoded.exp * 1000) } },
        { upsert: true },
      );

      return { ok: true, message: 'Sesión cerrada correctamente.' };
    } catch {
      const error = new Error('Error al cerrar sesión.') as Error & { status?: number };
      error.status = 500;
      throw error;
    }
  }

  async forgotPassword(data: ForgotPasswordDto) {
    if (!data.email) {
      throw new Error('email es obligatorio.');
    }

    const normalizedEmail = normalizeEmail(data.email);
    const genericMessage = 'Si existe una cuenta con ese email, enviaremos instrucciones para recuperar la contraseña.';

    const user = await User.findOne({
      'webAuth.email': normalizedEmail,
      deletedAt: { $exists: false },
    });

    const responsePayload: Record<string, unknown> = {
      ok: true,
      message: genericMessage,
    };

    if (user?.webAuth?.email) {
      const { token, tokenHash, expiresAt } = createResetToken();
      const resetUrl = buildPasswordResetUrl(token);

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            'webAuth.resetToken': tokenHash,
            'webAuth.resetTokenExpiresAt': expiresAt,
          },
        },
      );

      if (isMailConfigured()) {
        await sendPasswordResetEmail({
          to: user.webAuth.email,
          name: user.name,
          resetUrl,
          expiresAt,
        });
      }

      if (process.env.NODE_ENV !== 'production' || !isMailConfigured()) {
        responsePayload.data = {
          resetToken: token,
          expiresAt,
          resetUrl,
          emailSent: isMailConfigured(),
        };
      }
    }

    return responsePayload;
  }

  async resetPassword(data: ResetPasswordDto) {
    if (!data.token || !data.password) {
      throw new Error('token y password son obligatorios.');
    }

    if (data.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres.');
    }

    const tokenHash = hashResetToken(data.token);
    const user = await User.findOne({
      'webAuth.resetToken': tokenHash,
      'webAuth.resetTokenExpiresAt': { $gt: new Date() },
      deletedAt: { $exists: false },
    });

    if (!user) {
      throw new Error('El token de recuperación es inválido o expiró.');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          'webAuth.passwordHash': passwordHash,
        },
        $unset: {
          'webAuth.resetToken': '',
          'webAuth.resetTokenExpiresAt': '',
        },
      },
    );

    return { ok: true, message: 'La contraseña fue actualizada correctamente.' };
  }

  getBotApiKey() {
    return process.env.BOT_API_KEY?.trim();
  }

  isAuthorizedBotRequest(req: Request) {
    const botApiKey = this.getBotApiKey();
    const botTokenHeader = req.headers['x-bot-token'];
    const botToken = Array.isArray(botTokenHeader) ? botTokenHeader[0] : botTokenHeader;

    if (!botApiKey || typeof botToken !== 'string') {
      return false;
    }

    return botToken.trim() === botApiKey;
  }

  private async authenticateWebCredentials(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({
      'webAuth.email': normalizedEmail,
      deletedAt: { $exists: false },
    }).select('+webAuth.passwordHash');

    const invalidMessage = 'Credenciales inválidas.';

    if (!user || !user.webAuth?.passwordHash) {
      return { error: invalidMessage } as const;
    }

    const passwordMatch = await bcrypt.compare(password, user.webAuth.passwordHash);
    if (!passwordMatch) {
      return { error: invalidMessage } as const;
    }

    return { user } as const;
  }

  private signAuthToken(user: { _id: { toString(): string }; role: unknown }) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return { ok: false, error: 'Error de configuración del servidor.', status: 500 } as const;
    }

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role },
      secret,
      { expiresIn: TOKEN_EXPIRY },
    );

    return { ok: true, token } as const;
  }

  private buildAuthenticatedUserPayload(user: {
    _id?: unknown;
    name?: string;
    webAuth?: { email?: string | undefined } | undefined;
    phone?: string;
    identityDocumentType?: unknown;
    identityDocument?: string;
    ciudad?: string;
    direccion?: string;
    avatarUrl?: string;
    playerCategory?: unknown;
    role?: unknown;
    status?: unknown;
  }) {
    return {
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.webAuth?.email,
        phone: user.phone,
        identityDocumentType: user.identityDocumentType,
        identityDocument: user.identityDocument,
        ciudad: user.ciudad,
        direccion: user.direccion,
        avatarUrl: user.avatarUrl,
        playerCategory: user.playerCategory,
        role: user.role,
        status: user.status,
      },
    };
  }

}