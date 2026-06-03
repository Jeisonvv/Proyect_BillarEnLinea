import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { clearAuthCookie, setAuthCookie } from '../../utils/auth-token.js';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateProfileDto } from './dto/auth.dto.js';
import { AuthNestService } from './auth.service.js';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
]);

@Controller('api/auth')
export class AuthNestController {
  constructor(private readonly authService: AuthNestService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    if (!req.user?.id) {
      throw new HttpException({ ok: false, message: 'Token de autenticación requerido.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.authService.getCurrentUser(req.user.id);
    } catch (error: any) {
      const status = error.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMe(@Req() req: Request, @Body() body: UpdateProfileDto) {
    if (!req.user?.id) {
      throw new HttpException({ ok: false, message: 'Token de autenticación requerido.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.authService.updateCurrentUser(req.user.id, body);
    } catch (error: any) {
      const status = error.message === 'Usuario autenticado no encontrado.'
        ? HttpStatus.NOT_FOUND
        : error.message === 'Este email ya está registrado.' || error.message === 'Este teléfono ya está registrado.'
          ? HttpStatus.CONFLICT
          : error.status ?? HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post('me/avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      // Mobile photos are often larger than 5MB even before editing.
      fileSize: 20 * 1024 * 1024,
      files: 1,
    },
  }))
  async uploadMyAvatar(@Req() req: Request, @UploadedFile() file: Express.Multer.File | undefined) {
    if (!req.user?.id) {
      throw new HttpException({ ok: false, message: 'Token de autenticación requerido.' }, HttpStatus.UNAUTHORIZED);
    }

    if (!file) {
      throw new HttpException({ ok: false, message: 'Debes adjuntar un archivo en el campo file.' }, HttpStatus.BAD_REQUEST);
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new HttpException({ ok: false, message: 'Tipo de archivo no permitido. Usa JPG, PNG, WEBP, GIF, AVIF, HEIC o HEIF.' }, HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.authService.uploadCurrentUserAvatar(req.user.id, file);
    } catch (error: any) {
      const status = error.message === 'Usuario autenticado no encontrado.'
        ? HttpStatus.NOT_FOUND
        : error.status ?? HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post('register')
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: Response) {
    try {
      const user = await this.authService.register(body);

      // Generar token y setear cookie igual que en login
      const loginResult = await this.authService.login({ email: body.email, password: body.password });
      setAuthCookie(res, loginResult.token);

      return {
        ok: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.webAuth?.email,
          identityDocument: user.identityDocument,
          role: user.role,
        },
      };
    } catch (error: any) {
      if (
        error.message === 'name, email, phone, identityDocument y password son obligatorios.'
        || error.message === 'La contraseña debe tener al menos 8 caracteres.'
        || error.message === 'El documento de identidad es inválido.'
      ) {
        throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
      }

      if (error.message === 'Este usuario ya existe.') {
        const message = error.duplicateField === 'identityDocument'
          ? 'Este documento de identidad ya está registrado.'
          : 'Este email ya está registrado.';
        throw new HttpException({ ok: false, message }, HttpStatus.CONFLICT);
      }

      if (error.code === 11000) {
        const message = error.keyPattern?.identityDocument
          ? 'Este documento de identidad ya está registrado.'
          : 'Este email ya está registrado.';
        throw new HttpException({ ok: false, message }, HttpStatus.CONFLICT);
      }

      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const result = await this.authService.login(body);

      if (this.authService.isAuthorizedBotRequest(req)) {
        return {
          ...result.payload,
          token: result.token,
        };
      }

      setAuthCookie(res, result.token);
      return result.payload;
    } catch (error: any) {
      const status = error.message === 'email y password son obligatorios.'
        ? HttpStatus.BAD_REQUEST
        : error.message === 'Credenciales inválidas.'
          ? HttpStatus.UNAUTHORIZED
          : error.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post('bot-login')
  async botLogin(@Body() body: LoginDto, @Req() req: Request) {
    if (!this.authService.getBotApiKey()) {
      throw new HttpException({ ok: false, message: 'BOT_API_KEY no está configurado en el servidor.' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!this.authService.isAuthorizedBotRequest(req)) {
      throw new HttpException({ ok: false, message: 'Acceso restringido al bot.' }, HttpStatus.FORBIDDEN);
    }

    try {
      const result = await this.authService.login(body);
      return {
        ...result.payload,
        token: result.token,
      };
    } catch (error: any) {
      const status = error.message === 'email y password son obligatorios.'
        ? HttpStatus.BAD_REQUEST
        : error.message === 'Credenciales inválidas.'
          ? HttpStatus.UNAUTHORIZED
          : error.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    try {
      return await this.authService.forgotPassword(body);
    } catch (error: any) {
      const status = error.message === 'email es obligatorio.'
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    try {
      return await this.authService.resetPassword(body);
    } catch (error: any) {
      const status = (
        error.message === 'token y password son obligatorios.'
        || error.message === 'La contraseña debe tener al menos 8 caracteres.'
        || error.message === 'El token de recuperación es inválido o expiró.'
      )
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);
    try {
      return await this.authService.logout(req);
    } catch (error: any) {
      const status = error.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }
}