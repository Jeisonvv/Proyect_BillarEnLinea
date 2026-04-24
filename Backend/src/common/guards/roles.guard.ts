import { Injectable, Optional } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { UserRole } from '../../models/enums.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Optional() private readonly reflector: Reflector = new Reflector()) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (!request.user) {
      response.status(401).json({ ok: false, message: 'No autenticado.' });
      return false;
    }

    if (!roles.includes(request.user.role)) {
      response.status(403).json({
        ok: false,
        message: `Acceso denegado. Se requiere uno de estos roles: ${roles.join(', ')}.`,
      });
      return false;
    }

    return true;
  }
}