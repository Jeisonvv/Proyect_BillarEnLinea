import { Injectable } from '@nestjs/common';
import type { UserRole } from '../../models/enums.js';
import { createWompiCheckoutForActivity } from '../../services/payment.service.js';
import {
  createActivityService,
  deleteActivityService,
  drawActivityService,
  getAvailableActivityNumbersService,
  getMyActivityNumbersService,
  releaseMyActivityReservationsService,
  getActivityByIdService,
  getActivityNumberOwnersService,
  getActivityNumbersService,
  listActivitiesService,
  purchaseActivityTicketsService,
  updateActivityService,
} from '../../services/activity.service.js';
import type {
  CreateActivityCheckoutDto,
  CreateActivityDto,
  DrawActivityDto,
  ListActivityNumbersQueryDto,
  ListActivitiesQueryDto,
  PurchaseActivityTicketsDto,
  UpdateActivityDto,
} from './dto/activities.dto.js';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class ActivitiesNestService {
  createActivity(data: CreateActivityDto, createdBy: string) {
    return createActivityService(data, createdBy);
  }

  updateActivity(id: string, data: UpdateActivityDto) {
    return updateActivityService(id, data);
  }

  listActivities(query: ListActivitiesQueryDto) {
    return listActivitiesService({
      ...(query.status !== undefined && { status: query.status }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '20'),
    });
  }

  getActivityById(id: string) {
    return getActivityByIdService(id);
  }

  getActivityNumbers(id: string, query: ListActivityNumbersQueryDto) {
    return getActivityNumbersService(id, {
      ...(query.status !== undefined && { status: query.status }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '100'),
    });
  }

  getActivityNumberOwners(id: string, query: ListActivityNumbersQueryDto) {
    return getActivityNumberOwnersService(id, {
      ...(query.status !== undefined && { status: query.status }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '100'),
    });
  }

  getAvailableActivityNumbers(id: string) {
    return getAvailableActivityNumbersService(id);
  }

  getMyActivityNumbers(id: string, userId: string) {
    return getMyActivityNumbersService(id, userId);
  }

  releaseMyActivityReservations(id: string, userId: string, numbers?: string[]) {
    return releaseMyActivityReservationsService(id, userId, numbers);
  }

  purchaseActivityTickets(id: string, actor: ActorContext, data: PurchaseActivityTicketsDto) {
    return purchaseActivityTicketsService(id, actor, data);
  }

  createWompiCheckout(id: string, actor: ActorContext, data: CreateActivityCheckoutDto) {
    return createWompiCheckoutForActivity(id, actor, data);
  }

  drawActivity(id: string, data: DrawActivityDto) {
    return drawActivityService(id, data.winningNumber);
  }

  deleteActivity(id: string) {
    return deleteActivityService(id);
  }
}