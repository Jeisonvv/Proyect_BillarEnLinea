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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../models/enums.js';
import { isActivitySalesClosedError } from '../../utils/activity-sale-window.js';
import type {
  CreateActivityCheckoutDto,
  CreateActivityDto,
  DrawActivityDto,
  ListActivityNumbersQueryDto,
  ListActivitiesQueryDto,
  PurchaseActivityTicketsDto,
  UpdateActivityDto,
} from './dto/activities.dto.js';
import { ActivitiesNestService } from './activities.service.js';

@Controller('api/activities')
export class ActivitiesNestController {
  constructor(private readonly activitiesService: ActivitiesNestService) {}

  private buildErrorBody(error: any) {
    return {
      ok: false,
      message: error.message,
      ...(isActivitySalesClosedError(error)
        ? {
          code: error.code,
          saleClosesAt: error.saleClosesAt,
          timezone: error.timezone,
        }
        : {}),
    };
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createActivity(@Req() req: Request, @Body() body: CreateActivityDto) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const activity = await this.activitiesService.createActivity(body, req.user.id);
      return { ok: true, data: activity };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async getActivities(@Query() query: ListActivitiesQueryDto) {
    try {
      const page = Number(query.page ?? '1');
      const limit = Number(query.limit ?? '20');
      const result = await this.activitiesService.listActivities(query);

      return {
        ok: true,
        data: result.activities,
        pagination: {
          total: result.total,
          page,
          limit,
        },
      };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getActivityById(@Param('id') id: string) {
    try {
      const activity = await this.activitiesService.getActivityById(id);
      return { ok: true, data: activity };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id/numbers')
  async getActivityNumbers(@Param('id') id: string, @Query() query: ListActivityNumbersQueryDto) {
    try {
      const result = await this.activitiesService.getActivityNumbers(id, query);
      return { ok: true, data: result };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id/number-owners')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getActivityNumberOwners(@Param('id') id: string, @Query() query: ListActivityNumbersQueryDto) {
    try {
      const result = await this.activitiesService.getActivityNumberOwners(id, query);
      return { ok: true, data: result };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id/available-numbers')
  async getAvailableActivityNumbers(@Param('id') id: string) {
    try {
      const result = await this.activitiesService.getAvailableActivityNumbers(id);
      return { ok: true, data: result };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id/my-numbers')
  @UseGuards(AuthGuard)
  async getMyActivityNumbers(@Req() req: Request, @Param('id') id: string) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.activitiesService.getMyActivityNumbers(id, req.user.id);
      return { ok: true, data: result };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Delete(':id/my-numbers')
  @UseGuards(AuthGuard)
  async releaseMyActivityReservations(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { numbers?: string[] } = {},
  ) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const numbers = Array.isArray(body?.numbers)
        ? body.numbers.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
        : undefined;
      const result = await this.activitiesService.releaseMyActivityReservations(
        id,
        req.user.id,
        numbers && numbers.length > 0 ? numbers : undefined,
      );
      return { ok: true, data: result };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post(':id/tickets')
  @UseGuards(AuthGuard, RolesGuard)
  async purchaseActivityTickets(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: PurchaseActivityTicketsDto,
  ) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const ticket = await this.activitiesService.purchaseActivityTickets(id, req.user, body);
      return { ok: true, data: ticket };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(this.buildErrorBody(error), status);
    }
  }

  @Post(':id/wompi/checkout')
  @UseGuards(AuthGuard, RolesGuard)
  async createWompiCheckout(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: CreateActivityCheckoutDto,
  ) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const data = await this.activitiesService.createWompiCheckout(id, req.user, body);
      return { ok: true, data };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(this.buildErrorBody(error), status);
    }
  }

  @Post(':id/draw')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async drawActivity(@Param('id') id: string, @Body() body: DrawActivityDto) {
    try {
      const result = await this.activitiesService.drawActivity(id, body);
      return { ok: true, message: result.message, data: result.activity, hasWinner: result.hasWinner };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateActivity(@Param('id') id: string, @Body() body: UpdateActivityDto) {
    try {
      const activity = await this.activitiesService.updateActivity(id, body);
      return { ok: true, data: activity };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteActivity(@Param('id') id: string) {
    try {
      const result = await this.activitiesService.deleteActivity(id);
      return { ok: true, message: 'Rifa eliminada correctamente.', data: result };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }
}