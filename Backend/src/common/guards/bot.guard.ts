import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class BotGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const botApiKey = process.env.BOT_API_KEY?.trim();
    const botTokenHeader = request.headers['x-bot-token'];
    const botToken = Array.isArray(botTokenHeader) ? botTokenHeader[0] : botTokenHeader;

    if (!botApiKey) {
      response.status(500).json({ ok: false, message: 'BOT_API_KEY no está configurado en el servidor.' });
      return false;
    }

    if (typeof botToken !== 'string' || botToken.trim() !== botApiKey) {
      response.status(403).json({ ok: false, message: 'Acceso restringido al bot.' });
      return false;
    }

    return true;
  }
}