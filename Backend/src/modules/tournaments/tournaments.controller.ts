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
import type {
  AddTournamentPlayerToGroupDto,
  AutoCreateTournamentGroupsDto,
  CreateTournamentGroupsDto,
  CreateTournamentCheckoutDto,
  CreateTournamentDto,
  ListTournamentsQueryDto,
  RegisterTournamentPlayerDto,
  SelfRegisterTournamentDto,
  UpdateTournamentHandicapDto,
} from './dto/tournaments.dto.js';
import { TournamentsNestService } from './tournaments.service.js';

@Controller('api/tournaments')
export class TournamentsNestController {
  constructor(private readonly tournamentsService: TournamentsNestService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createTournament(@Req() req: Request, @Body() body: CreateTournamentDto) {
    if (!req.user?.id) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const tournament = await this.tournamentsService.createTournamentForActor(body, req.user.id);
      return { ok: true, data: tournament };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteTournament(@Param('id') id: string) {
    try {
      const result = await this.tournamentsService.deleteTournament(id);
      return { ok: true, message: 'Torneo eliminado correctamente.', data: result };
    } catch (error: any) {
      const status = error.message === 'Torneo no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get()
  async getTournaments(@Query() query: ListTournamentsQueryDto) {
    try {
      const page = Number(query.page ?? '1');
      const limit = Number(query.limit ?? '20');
      const { tournaments, total } = await this.tournamentsService.listTournaments(query);
      return { ok: true, data: tournaments, pagination: { total, page, limit } };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('slug/:slug')
  async getTournamentBySlug(@Param('slug') slug: string) {
    try {
      const data = await this.tournamentsService.getTournamentBySlug(slug);
      return { ok: true, data };
    } catch (error: any) {
      const status = error.message === 'Torneo no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id')
  async getTournamentById(@Param('id') id: string) {
    try {
      const data = await this.tournamentsService.getTournamentById(id);
      return { ok: true, data };
    } catch (error: any) {
      const status = error.message === 'Torneo no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id/registrations')
  async getTournamentRegistrations(@Param('id') id: string, @Query('status') status?: string) {
    try {
      const registrations = await this.tournamentsService.getTournamentRegistrations(id, status);
      return { ok: true, total: registrations.length, data: registrations };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/register-self')
  @UseGuards(AuthGuard, RolesGuard)
  async selfRegisterToTournament(@Req() req: Request, @Param('id') id: string, @Body() body: SelfRegisterTournamentDto) {
    if (!req.user?.id) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    if (body.handicap !== undefined) {
      throw new HttpException(
        { ok: false, message: 'El handicap solo puede ser asignado por un administrador o staff.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const tournament = await this.tournamentsService.getTournamentEntryFee(id);

      if (!tournament) {
        throw new HttpException({ ok: false, message: 'Torneo no encontrado.' }, HttpStatus.NOT_FOUND);
      }

      const registration = await this.tournamentsService.selfRegisterToTournament(id, req.user.id, body);

      if (tournament.entryFee > 0 && registration.playerCategory !== 'SIN_DEFINIR') {
        const checkout = await this.tournamentsService.createTournamentWompiCheckout(id, req.user, {
          ...(body.channel !== undefined && { channel: body.channel }),
          ...(body.notes !== undefined && { notes: body.notes }),
        });

        return {
          ok: true,
          requiresPayment: true,
          registrationStatus: registration.status,
          data: checkout,
        };
      }

      return {
        ok: true,
        requiresPayment: false,
        registrationStatus: registration.status,
        ...(registration.playerCategory === 'SIN_DEFINIR'
          ? { message: 'La inscripción quedó pendiente de confirmación por un administrador.' }
          : {}),
        data: registration,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      const status = error.message === 'Torneo no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post(':id/register')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async registerPlayer(@Param('id') id: string, @Body() body: RegisterTournamentPlayerDto) {
    if (!body.userId) {
      throw new HttpException({ ok: false, message: "Se requiere 'userId'." }, HttpStatus.BAD_REQUEST);
    }

    try {
      const registration = await this.tournamentsService.registerPlayer(id, body.userId, body);
      return { ok: true, data: registration };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/wompi/checkout')
  @UseGuards(AuthGuard, RolesGuard)
  async createTournamentWompiCheckout(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: CreateTournamentCheckoutDto,
  ) {
    if (!req.user) {
      throw new HttpException({ ok: false, message: 'No autenticado.' }, HttpStatus.UNAUTHORIZED);
    }

    if (req.user.role === UserRole.CUSTOMER && body.handicap !== undefined) {
      throw new HttpException(
        { ok: false, message: 'El handicap solo puede ser asignado por un administrador o staff.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const data = await this.tournamentsService.createTournamentWompiCheckout(id, req.user, body);
      return { ok: true, data };
    } catch (error: any) {
      const status = error.message === 'Torneo no encontrado.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Patch(':id/registrations/:userId/handicap')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateHandicap(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: UpdateTournamentHandicapDto,
  ) {
    const { handicap } = body;

    if (handicap === undefined || handicap === null) {
      throw new HttpException({ ok: false, message: "Se requiere el campo 'handicap'." }, HttpStatus.BAD_REQUEST);
    }

    const parsed = Number(handicap);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new HttpException({ ok: false, message: "'handicap' debe ser un número positivo." }, HttpStatus.BAD_REQUEST);
    }

    try {
      const registration = await this.tournamentsService.updateHandicap(id, userId, parsed);
      return { ok: true, message: `Handicap actualizado a ${parsed}.`, data: registration };
    } catch (error: any) {
      const status = error.message.includes('no encontrado') || error.message.includes('Inscripción no encontrada')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id/bracket')
  async getBracket(@Param('id') id: string) {
    try {
      const bracket = await this.tournamentsService.getBracket(id);
      if (!bracket) {
        throw new HttpException(
          { ok: false, message: 'El bracket aún no ha sido generado para este torneo.' },
          HttpStatus.NOT_FOUND,
        );
      }
      return { ok: true, data: bracket };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { ok: false, message: error.message ?? 'Error al obtener el bracket.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/results')
  async getResults(@Param('id') id: string) {
    try {
      const data = await this.tournamentsService.getTournamentResults(id);
      return { ok: true, data };
    } catch (error: any) {
      const status = error.message.includes('no encontrado') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get(':id/pending-payments')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getPendingPayments(@Param('id') id: string) {
    try {
      const data = await this.tournamentsService.getPendingPayments(id);
      return { ok: true, data };
    } catch (error: any) {
      const status = error.message.includes('no encontrado') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post(':id/generate-bracket')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async generateBracket(@Param('id') id: string) {
    try {
      const { rounds, matches } = await this.tournamentsService.generateBracket(id);
      return {
        ok: true,
        message: 'Bracket generado correctamente.',
        data: { totalRounds: rounds.length, totalMatches: matches.length, matches },
      };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id/group-standings')
  async getGroupStandings(@Param('id') id: string) {
    try {
      const { totalAdvancing, groups } = await this.tournamentsService.getGroupStandings(id);
      return { ok: true, totalAdvancing, data: groups };
    } catch (error: any) {
      const status = error.message.includes('no encontrado') || error.message.includes('No hay grupos')
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post(':id/groups')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createGroups(@Param('id') id: string, @Body() body: CreateTournamentGroupsDto) {
    if (!body.groups || !Array.isArray(body.groups) || body.groups.length === 0) {
      throw new HttpException({ ok: false, message: 'Se requiere un array de grupos.' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const created = await this.tournamentsService.createGroups(id, body);
      return { ok: true, message: `${created.length} grupos creados correctamente.`, data: created };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/add-groups')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async addGroups(@Param('id') id: string, @Body() body: CreateTournamentGroupsDto) {
    if (!body.groups || !Array.isArray(body.groups) || body.groups.length === 0) {
      throw new HttpException({ ok: false, message: 'Se requiere un array de grupos.' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const created = await this.tournamentsService.addGroups(id, body);
      return {
        ok: true,
        message: `${created.length} grupo(s) agregado(s) correctamente. Las inscripciones PENDING de estos jugadores fueron confirmadas.`,
        data: created,
      };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/groups/:groupId/add-player')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async addPlayerToGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
    @Body() body: AddTournamentPlayerToGroupDto,
  ) {
    if (!body.userId) {
      throw new HttpException({ ok: false, message: "Se requiere el campo 'userId'." }, HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.tournamentsService.addPlayerToGroup(id, groupId, body);
      return {
        ok: true,
        message: `Jugador agregado al grupo. Se crearon ${result.newMatchesCreated} partido(s) nuevo(s).`,
        data: result,
      };
    } catch (error: any) {
      const status = error.message.includes('no encontrado') || error.message.includes('no está inscrito')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post(':id/auto-groups')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async autoCreateGroups(@Param('id') id: string, @Body() body: AutoCreateTournamentGroupsDto) {
    try {
      const groups = await this.tournamentsService.autoCreateGroups(id, body);
      const countBySize: Record<number, number> = {};
      for (const group of groups as any[]) {
        const size = group.totalPlayers as number;
        countBySize[size] = (countBySize[size] ?? 0) + 1;
      }
      const sizeDetail = Object.entries(countBySize)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([size, count]) => `${count} de ${size} jugadores`)
        .join(', ');

      return {
        ok: true,
        message: `Se crearon ${groups.length} grupos en total: ${sizeDetail}.`,
        data: { groups },
      };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id/adjustment-round')
  async getAdjustmentRound(@Param('id') id: string) {
    try {
      const data = await this.tournamentsService.getAdjustmentRound(id);
      return { ok: true, data };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.NOT_FOUND);
    }
  }

  @Post(':id/generate-adjustment-round')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async generateAdjustmentRound(@Param('id') id: string) {
    try {
      const data = await this.tournamentsService.generateAdjustmentRound(id);
      return { ok: true, message: data.message, data };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/generate-bracket-from-groups')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async generateBracketFromGroups(@Param('id') id: string) {
    try {
      const { totalPlayers, rounds, matches } = await this.tournamentsService.generateBracketFromGroups(id);
      const roundSummary = rounds.map((round) => `${round.label} (${round.players} jugadores)`).join(' → ');
      const message = `Bracket generado con ${totalPlayers} jugadores: ${roundSummary}.`;
      return { ok: true, message, totalPlayers, rounds, data: { matches } };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/notify-groups')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async notifyGroups(@Param('id') id: string) {
    try {
      const notifications = await this.tournamentsService.notifyGroups(id);
      return { ok: true, message: `Notificaciones preparadas para ${notifications.length} grupos.`, data: notifications };
    } catch (error: any) {
      const status = error.message.includes('no encontrado') || error.message.includes('No hay grupos')
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }
}