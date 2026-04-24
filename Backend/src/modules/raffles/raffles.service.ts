import { Injectable } from '@nestjs/common';
import type { UserRole } from '../../models/enums.js';
import { createWompiCheckoutForRaffle } from '../../services/payment.service.js';
import {
  createRaffleService,
  deleteRaffleService,
  drawRaffleService,
  getAvailableRaffleNumbersService,
  getRaffleByIdService,
  getRaffleNumberOwnersService,
  getRaffleNumbersService,
  listRafflesService,
  purchaseRaffleTicketsService,
} from '../../services/raffle.service.js';
import type {
  CreateRaffleCheckoutDto,
  CreateRaffleDto,
  DrawRaffleDto,
  ListRaffleNumbersQueryDto,
  ListRafflesQueryDto,
  PurchaseRaffleTicketsDto,
} from './dto/raffles.dto.js';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class RafflesNestService {
  createRaffle(data: CreateRaffleDto, createdBy: string) {
    return createRaffleService(data, createdBy);
  }

  listRaffles(query: ListRafflesQueryDto) {
    return listRafflesService({
      ...(query.status !== undefined && { status: query.status }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '20'),
    });
  }

  getRaffleById(id: string) {
    return getRaffleByIdService(id);
  }

  getRaffleNumbers(id: string, query: ListRaffleNumbersQueryDto) {
    return getRaffleNumbersService(id, {
      ...(query.status !== undefined && { status: query.status }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '100'),
    });
  }

  getRaffleNumberOwners(id: string, query: ListRaffleNumbersQueryDto) {
    return getRaffleNumberOwnersService(id, {
      ...(query.status !== undefined && { status: query.status }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '100'),
    });
  }

  getAvailableRaffleNumbers(id: string) {
    return getAvailableRaffleNumbersService(id);
  }

  purchaseRaffleTickets(id: string, actor: ActorContext, data: PurchaseRaffleTicketsDto) {
    return purchaseRaffleTicketsService(id, actor, data);
  }

  createWompiCheckout(id: string, actor: ActorContext, data: CreateRaffleCheckoutDto) {
    return createWompiCheckoutForRaffle(id, actor, data);
  }

  drawRaffle(id: string, data: DrawRaffleDto) {
    return drawRaffleService(id, data.winningNumber);
  }

  deleteRaffle(id: string) {
    return deleteRaffleService(id);
  }
}