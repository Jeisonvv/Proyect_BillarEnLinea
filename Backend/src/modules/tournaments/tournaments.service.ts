import { Injectable } from '@nestjs/common';
import type { UserRole } from '../../models/enums.js';
import Tournament from '../../models/tournament.model.js';
import { createWompiCheckoutForTournament } from '../../services/payment.service.js';
import {
  addGroupsService,
  addPlayerToGroupService,
  autoCreateGroupsService,
  createGroupsService,
  createTournamentService,
  createTournamentForActorService,
  deleteTournamentService,
  generateAdjustmentRoundService,
  generateBracketFromGroupsService,
  generateBracketService,
  getAdjustmentRoundService,
  getBracketService,
  getGroupNotificationsService,
  getGroupStandingsService,
  getPendingPaymentsService,
  getTournamentByIdService,
  getTournamentBySlugService,
  getTournamentRegistrationsService,
  getTournamentSelfRegistrationStateService,
  getTournamentResultsService,
  listTournamentsService,
  registerPlayerService,
  setTournamentRegistrationStatusService,
  selfRegisterToTournamentService,
  updateHandicapService,
  updateTournamentAdminService,
  updateTournamentRegistrationPlayerCategoryService,
} from '../../services/tournament.service.js';
import type {
  AddTournamentPlayerToGroupDto,
  AutoCreateTournamentGroupsDto,
  CreateTournamentGroupsDto,
  CreateTournamentCheckoutDto,
  CreateTournamentDto,
  ListTournamentsQueryDto,
  RegisterTournamentPlayerDto,
  SelfRegisterTournamentDto,
  UpdateAdminTournamentDto,
  UpdateTournamentRegistrationStatusDto,
} from './dto/tournaments.dto.js';

interface ActorContext {
  id: string;
  role: UserRole;
}

@Injectable()
export class TournamentsNestService {
  createTournament(data: CreateTournamentDto) {
    return createTournamentService(data);
  }

  createTournamentForActor(data: CreateTournamentDto, actorId: string) {
    return createTournamentForActorService(data, actorId);
  }

  updateTournament(id: string, data: UpdateAdminTournamentDto) {
    return updateTournamentAdminService(id, data as Record<string, unknown>);
  }

  deleteTournament(id: string) {
    return deleteTournamentService(id);
  }

  listTournaments(query: ListTournamentsQueryDto) {
    return listTournamentsService({
      ...(query.status !== undefined && { status: query.status }),
      ...(query.format !== undefined && { format: query.format }),
      page: Number(query.page ?? '1'),
      limit: Number(query.limit ?? '20'),
    });
  }

  getTournamentById(id: string) {
    return getTournamentByIdService(id);
  }

  getTournamentBySlug(slug: string) {
    return getTournamentBySlugService(slug);
  }

  getTournamentRegistrations(id: string, status?: string) {
    return getTournamentRegistrationsService(id, status);
  }

  getTournamentSelfRegistrationState(id: string, userId: string) {
    return getTournamentSelfRegistrationStateService(id, userId);
  }

  registerPlayer(id: string, userId: string, data: RegisterTournamentPlayerDto) {
    return registerPlayerService(id, userId, {
      ...(data.handicap !== undefined && { handicap: data.handicap }),
      ...((data.playerCategory ?? data.category) !== undefined && { playerCategory: data.playerCategory ?? data.category }),
      ...(data.channel !== undefined && { channel: data.channel }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.groupStageSlotId !== undefined && { groupStageSlotId: data.groupStageSlotId }),
    });
  }

  selfRegisterToTournament(id: string, userId: string, data: SelfRegisterTournamentDto) {
    return selfRegisterToTournamentService(id, userId, {
      ...((data.playerCategory ?? data.category) !== undefined && { playerCategory: data.playerCategory ?? data.category }),
      ...(data.channel !== undefined && { channel: data.channel }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.groupStageSlotId !== undefined && { groupStageSlotId: data.groupStageSlotId }),
    });
  }

  createTournamentWompiCheckout(id: string, actor: ActorContext, data: CreateTournamentCheckoutDto) {
    return createWompiCheckoutForTournament(id, actor, data);
  }

  updateHandicap(tournamentId: string, userId: string, handicap: number) {
    return updateHandicapService(tournamentId, userId, handicap);
  }

  updateRegistrationPlayerCategory(tournamentId: string, userId: string, playerCategory: string) {
    return updateTournamentRegistrationPlayerCategoryService(tournamentId, userId, playerCategory);
  }

  setRegistrationStatus(tournamentId: string, userId: string, data: UpdateTournamentRegistrationStatusDto) {
    return setTournamentRegistrationStatusService(tournamentId, userId, {
      status: data.status,
      ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
      ...(data.paymentReference !== undefined && { paymentReference: data.paymentReference }),
      ...(data.paidAt !== undefined && { paidAt: data.paidAt }),
    });
  }

  getPendingPayments(id: string) {
    return getPendingPaymentsService(id);
  }

  getTournamentEntryFee(id: string) {
    return Tournament.findById(id).select('_id entryFee').lean();
  }

  generateBracket(id: string) {
    return generateBracketService(id);
  }

  getBracket(id: string) {
    return getBracketService(id);
  }

  getTournamentResults(id: string) {
    return getTournamentResultsService(id);
  }

  getGroupStandings(id: string) {
    return getGroupStandingsService(id);
  }

  createGroups(id: string, data: CreateTournamentGroupsDto) {
    return createGroupsService(id, (data.groups ?? []) as any);
  }

  addGroups(id: string, data: CreateTournamentGroupsDto) {
    return addGroupsService(id, (data.groups ?? []) as any);
  }

  addPlayerToGroup(id: string, groupId: string, data: AddTournamentPlayerToGroupDto) {
    return addPlayerToGroupService(id, groupId, data.userId as string);
  }

  autoCreateGroups(id: string, data: AutoCreateTournamentGroupsDto) {
    return autoCreateGroupsService(id, data.playersPerGroup);
  }

  getAdjustmentRound(id: string) {
    return getAdjustmentRoundService(id);
  }

  generateAdjustmentRound(id: string) {
    return generateAdjustmentRoundService(id);
  }

  generateBracketFromGroups(id: string) {
    return generateBracketFromGroupsService(id);
  }

  notifyGroups(id: string) {
    return getGroupNotificationsService(id);
  }
}