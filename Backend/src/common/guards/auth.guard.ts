import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import RevokedToken from '../../models/revoked-token.model.js';
import { UserRole } from '../../models/enums.js';
import { extractAuthToken } from '../../utils/auth-token.js';

interface JwtPayload {
  sub: string;
  role: UserRole;
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const token = extractAuthToken(request);

    if (!token) {
      response.status(401).json({ ok: false, message: 'Token de autenticación requerido.' });
      return false;
    }

    const revoked = await RevokedToken.findOne({ token });
    if (revoked) {
      response.status(401).json({ ok: false, message: 'Token revocado. Por favor inicia sesión de nuevo.' });
      return false;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      response.status(500).json({ ok: false, message: 'Error de configuración del servidor.' });
      return false;
    }

    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      response.status(401).json({ ok: false, message: 'Token inválido o expirado.' });
      return false;
    }
  }
}