import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BotGuard } from '../../common/guards/bot.guard.js';
import type {
  EnsureLeadSessionDto,
  UpdateLeadSessionDataDto,
  UpdateLeadSessionStateDto,
} from './dto/lead-sessions.dto.js';
import { LeadSessionsNestService } from './lead-sessions.service.js';

@Controller('api/lead-sessions')
@UseGuards(BotGuard)
export class LeadSessionsNestController {
  constructor(private readonly leadSessionsService: LeadSessionsNestService) {}

  @Post()
  async ensureLeadSession(@Body() body: EnsureLeadSessionDto) {
    try {
      const result = await this.leadSessionsService.ensureLeadSession(body);
      return {
        ok: true,
        created: result.created,
        data: result.session,
      };
    } catch (error: any) {
      throw new HttpException(
        { ok: false, message: error.message },
        this.getErrorStatus(error),
      );
    }
  }

  @Get(':channel/:providerId')
  async getLeadSession(@Param('channel') channel: string, @Param('providerId') providerId: string) {
    this.assertChannelAndProviderId(channel, providerId);

    try {
      const session = await this.leadSessionsService.getLeadSession(channel, providerId);

      if (!session) {
        throw new HttpException({ ok: false, message: 'Sesión temporal no encontrada.' }, HttpStatus.NOT_FOUND);
      }

      return { ok: true, data: session };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        { ok: false, message: error.message },
        this.getErrorStatus(error),
      );
    }
  }

  @Put(':channel/:providerId/state')
  async updateLeadSessionState(
    @Param('channel') channel: string,
    @Param('providerId') providerId: string,
    @Body() body: UpdateLeadSessionStateDto,
  ) {
    this.assertChannelAndProviderId(channel, providerId);

    try {
      const session = await this.leadSessionsService.updateLeadSessionState(channel, providerId, body);
      return { ok: true, data: session };
    } catch (error: any) {
      throw new HttpException(
        { ok: false, message: error.message },
        this.getErrorStatus(error),
      );
    }
  }

  @Patch(':channel/:providerId/data')
  async updateLeadSessionData(
    @Param('channel') channel: string,
    @Param('providerId') providerId: string,
    @Body() body: UpdateLeadSessionDataDto,
  ) {
    this.assertChannelAndProviderId(channel, providerId);

    try {
      const session = await this.leadSessionsService.updateLeadSessionData(channel, providerId, body);
      return { ok: true, data: session };
    } catch (error: any) {
      throw new HttpException(
        { ok: false, message: error.message },
        this.getErrorStatus(error),
      );
    }
  }

  @Post(':channel/:providerId/promote')
  async promoteLeadSession(@Param('channel') channel: string, @Param('providerId') providerId: string) {
    this.assertChannelAndProviderId(channel, providerId);

    try {
      const result = await this.leadSessionsService.promoteLeadSession(channel, providerId);
      return { ok: true, data: result };
    } catch (error: any) {
      throw new HttpException(
        { ok: false, message: error.message },
        this.getErrorStatus(error),
      );
    }
  }

  private assertChannelAndProviderId(channel: string, providerId: string) {
    if (typeof channel !== 'string' || typeof providerId !== 'string') {
      throw new HttpException({ ok: false, message: 'Parámetros inválidos.' }, HttpStatus.BAD_REQUEST);
    }
  }

  private getErrorStatus(error: any) {
    if (error?.message === 'Sesión temporal no encontrada.') return HttpStatus.NOT_FOUND;
    if (error?.message === 'Este usuario ya existe.' || error?.code === 11000) return HttpStatus.CONFLICT;
    return HttpStatus.BAD_REQUEST;
  }
}