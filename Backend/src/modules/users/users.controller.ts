import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { BotGuard } from '../../common/guards/bot.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../models/enums.js';
import type { CreateUserDto, UpdateConversationStateDto, UpdateUserDto } from './dto/users.dto.js';
import { UsersNestService } from './users.service.js';

@Controller('api/users')
export class UsersNestController {
  constructor(private readonly usersService: UsersNestService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createUser(@Body() body: CreateUserDto) {
    try {
      const result = await this.usersService.createUser(body);
      return {
        ok: true,
        data: result.user,
        ...(result.requiresPasswordSetup !== undefined && { requiresPasswordSetup: result.requiresPasswordSetup }),
        ...(result.onboarding && { onboarding: result.onboarding }),
      };
    } catch (error: any) {
      if (error.message === 'No se permite enviar passwordHash manualmente desde este endpoint. Usa activación temporal.') {
        throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
      }

      if (error.message === 'Este usuario ya existe.') {
        throw new HttpException({
          ok: false,
          message: this.getDuplicateUserMessage(error.duplicateField),
          existingUser: error.existingUser,
        }, HttpStatus.CONFLICT);
      }

      if (error.code === 11000) {
        throw new HttpException({
          ok: false,
          message: this.getDuplicateUserMessageFromMongo(error),
        }, HttpStatus.CONFLICT);
      }

      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getUsers(@Query() query: Record<string, unknown>) {
    try {
      const page = Number(query.page ?? '1');
      const limit = Number(query.limit ?? '20');
      const { users, total } = await this.usersService.listUsers({
        ...(query.status !== undefined && { status: String(query.status) }),
        ...(query.role !== undefined && { role: String(query.role) }),
        ...(query.playerCategory !== undefined && { playerCategory: String(query.playerCategory) }),
        ...(query.search !== undefined && { search: String(query.search) }),
        page,
        limit,
      });
      return { ok: true, data: users, pagination: { total, page, limit } };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('by-phone/:phone')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getUserByPhone(@Param('phone') phone: string) {
    try {
      const user = await this.usersService.getUserByPhone(phone);
      return { ok: true, data: user };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.NOT_FOUND);
    }
  }

  @Get('by-provider/:provider/:providerId')
  @UseGuards(BotGuard)
  async getUserByProvider(@Param('provider') provider: string, @Param('providerId') providerId: string) {
    if (typeof provider !== 'string' || typeof providerId !== 'string') {
      throw new HttpException({ ok: false, message: 'Parámetros inválidos.' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const user = await this.usersService.getUserByProvider(provider, providerId);
      if (!user) {
        throw new HttpException({ ok: false, message: 'Usuario no encontrado.' }, HttpStatus.NOT_FOUND);
      }
      return { ok: true, data: user };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/conversation-state')
  @UseGuards(BotGuard)
  async getConversationStateByUserId(@Param('id') id: string, @Query('channel') channel?: string) {
    try {
      const user = await this.usersService.getUserById(id);
      const resolvedChannel = typeof channel === 'string' ? channel : 'WHATSAPP';
      const state = (user.conversationStates || []).find((item: any) => item.channel === resolvedChannel);
      if (!state) {
        throw new HttpException({ ok: false, message: `No hay estado para el canal ${resolvedChannel}` }, HttpStatus.NOT_FOUND);
      }
      return { ok: true, data: state };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      const status = error.message === 'Usuario no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Put(':id/conversation-state')
  @UseGuards(BotGuard)
  async updateConversationState(@Param('id') id: string, @Body() body: UpdateConversationStateDto) {
    try {
      const user = await this.usersService.updateConversationState(id, body);
      return { ok: true, data: user };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getUserById(@Param('id') id: string) {
    try {
      const user = await this.usersService.getUserById(id);
      return { ok: true, data: user };
    } catch (error: any) {
      const status = error.message === 'Usuario no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    try {
      const user = await this.usersService.updateUser(id, body);
      return { ok: true, data: user };
    } catch (error: any) {
      if (error.message === 'Este usuario ya existe.') {
        throw new HttpException({
          ok: false,
          message: this.getDuplicateUserMessage(error.duplicateField),
          existingUser: error.existingUser,
        }, HttpStatus.CONFLICT);
      }

      if (error.code === 11000) {
        throw new HttpException({ ok: false, message: this.getDuplicateUserMessageFromMongo(error) }, HttpStatus.CONFLICT);
      }

      const status = error.message === 'Usuario no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') id: string) {
    try {
      await this.usersService.deleteUser(id);
      return { ok: true, message: 'Usuario eliminado (soft delete).' };
    } catch (error: any) {
      const status = error.message === 'Usuario no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  private getDuplicateUserMessage(field?: string) {
    switch (field) {
      case 'identityDocument':
        return 'Este documento de identidad ya está registrado.';
      case 'phone':
        return 'Este teléfono ya está registrado.';
      case 'email':
        return 'Este email ya está registrado.';
      default:
        return 'Este usuario ya existe. Usa el _id del jugador existente para no duplicarlo.';
    }
  }

  private getDuplicateUserMessageFromMongo(error: any) {
    if (error?.keyPattern?.identityDocument) {
      return 'Este documento de identidad ya está registrado.';
    }

    if (error?.keyPattern?.phone) {
      return 'Este teléfono ya está registrado.';
    }

    if (error?.keyPattern?.['webAuth.email']) {
      return 'Este email ya está registrado.';
    }

    return 'Este usuario ya existe. Usa el _id del jugador existente para no duplicarlo.';
  }
}