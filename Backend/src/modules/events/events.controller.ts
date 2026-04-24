import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../models/enums.js';
import type { CreateEventDto, ListEventsQueryDto, UpdateEventDto } from './dto/events.dto.js';
import { EventsNestService } from './events.service.js';

@Controller('api/events')
export class EventsNestController {
  constructor(private readonly eventsService: EventsNestService) {}

  @Get()
  async getEvents(@Query() query: ListEventsQueryDto) {
    try {
      const page = Number(query.page ?? '1');
      const limit = Number(query.limit ?? '20');
      const { events, total } = await this.eventsService.listEvents(query);

      return {
        ok: true,
        data: events,
        pagination: { total, page, limit },
      };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getEventById(@Param('id') id: string) {
    try {
      const event = await this.eventsService.getEventById(id);
      return { ok: true, data: event };
    } catch (error: any) {
      const status = error.message === 'Evento no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createEvent(@Req() req: Request, @Body() body: CreateEventDto) {
    if (!req.user?.id) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const event = await this.eventsService.createEvent(body, req.user.id);
      return { ok: true, data: event };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateEvent(@Param('id') id: string, @Body() body: UpdateEventDto) {
    try {
      const event = await this.eventsService.updateEvent(id, body);
      return { ok: true, data: event };
    } catch (error: any) {
      const status = error.message === 'Evento no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteEvent(@Param('id') id: string) {
    try {
      await this.eventsService.deleteEvent(id);
      return { ok: true, message: 'Evento eliminado correctamente.' };
    } catch (error: any) {
      const status = error.message === 'Evento no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }
}