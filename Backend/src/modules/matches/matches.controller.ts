import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../models/enums.js';
import type { RecordMatchResultDto } from './dto/matches.dto.js';
import { MatchesNestService } from './matches.service.js';

@Controller('api/matches')
export class MatchesNestController {
  constructor(private readonly matchesService: MatchesNestService) {}

  @Get('tournament/:id')
  async getMatchesByTournament(@Param('id') id: string) {
    try {
      const data = await this.matchesService.getMatchesByTournament(id);
      return { ok: true, data };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getMatchById(@Param('id') id: string) {
    try {
      const match = await this.matchesService.getMatchById(id);
      return { ok: true, data: match };
    } catch (error: any) {
      const status = error.message === 'Partido no encontrado.'
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post(':id/result')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async recordMatchResult(@Param('id') id: string, @Body() body: RecordMatchResultDto) {
    const { score1, score2 } = body;

    if (score1 === undefined || score2 === undefined) {
      throw new HttpException(
        { ok: false, message: 'Se requieren score1 y score2.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const { result, isChampion } = await this.matchesService.recordMatchResult(id, score1, score2);
      return {
        ok: true,
        message: isChampion
          ? 'El torneo ha finalizado. Hay un campeón.'
          : 'Resultado registrado. El ganador avanzó al siguiente partido.',
        data: result,
      };
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }
}