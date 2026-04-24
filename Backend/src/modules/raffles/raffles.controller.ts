import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
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
import { isRaffleSalesClosedError } from '../../utils/raffle-sale-window.js';
import type {
  CreateRaffleCheckoutDto,
  CreateRaffleDto,
  DrawRaffleDto,
  ListRaffleNumbersQueryDto,
  ListRafflesQueryDto,
  PurchaseRaffleTicketsDto,
} from './dto/raffles.dto.js';
import { RafflesNestService } from './raffles.service.js';

@Controller('api/raffles')
export class RafflesNestController {
  constructor(private readonly rafflesService: RafflesNestService) {}

  private buildErrorBody(error: any) {
    return {
      ok: false,
      message: error.message,
      ...(isRaffleSalesClosedError(error)
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
  async createRaffle(@Req() req: Request, @Body() body: CreateRaffleDto) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const raffle = await this.rafflesService.createRaffle(body, req.user.id);
      return { ok: true, data: raffle };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async getRaffles(@Query() query: ListRafflesQueryDto) {
    try {
      const page = Number(query.page ?? '1');
      const limit = Number(query.limit ?? '20');
      const result = await this.rafflesService.listRaffles(query);

      return {
        ok: true,
        data: result.raffles,
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
  async getRaffleById(@Param('id') id: string) {
    try {
      const raffle = await this.rafflesService.getRaffleById(id);
      return { ok: true, data: raffle };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id/numbers')
  async getRaffleNumbers(@Param('id') id: string, @Query() query: ListRaffleNumbersQueryDto) {
    try {
      const result = await this.rafflesService.getRaffleNumbers(id, query);
      return { ok: true, data: result };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id/number-owners')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getRaffleNumberOwners(@Param('id') id: string, @Query() query: ListRaffleNumbersQueryDto) {
    try {
      const result = await this.rafflesService.getRaffleNumberOwners(id, query);
      return { ok: true, data: result };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id/available-numbers')
  async getAvailableRaffleNumbers(@Param('id') id: string) {
    try {
      const result = await this.rafflesService.getAvailableRaffleNumbers(id);
      return { ok: true, data: result };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post(':id/tickets')
  @UseGuards(AuthGuard, RolesGuard)
  async purchaseRaffleTickets(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: PurchaseRaffleTicketsDto,
  ) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const ticket = await this.rafflesService.purchaseRaffleTickets(id, req.user, body);
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
    @Body() body: CreateRaffleCheckoutDto,
  ) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const data = await this.rafflesService.createWompiCheckout(id, req.user, body);
      return { ok: true, data };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(this.buildErrorBody(error), status);
    }
  }

  @Post(':id/draw')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async drawRaffle(@Param('id') id: string, @Body() body: DrawRaffleDto) {
    try {
      const result = await this.rafflesService.drawRaffle(id, body);
      return { ok: true, message: result.message, data: result.raffle, hasWinner: result.hasWinner };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteRaffle(@Param('id') id: string) {
    try {
      const result = await this.rafflesService.deleteRaffle(id);
      return { ok: true, message: 'Rifa eliminada correctamente.', data: result };
    } catch (error: any) {
      const status = error.message === 'Rifa no encontrada.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }
}