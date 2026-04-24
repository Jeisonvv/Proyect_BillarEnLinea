import { Injectable } from '@nestjs/common';
import {
  getMatchByIdService,
  getMatchesByTournamentService,
  recordMatchResultService,
} from '../../services/match.service.js';

@Injectable()
export class MatchesNestService {
  getMatchesByTournament(tournamentId: string) {
    return getMatchesByTournamentService(tournamentId);
  }

  getMatchById(matchId: string) {
    return getMatchByIdService(matchId);
  }

  recordMatchResult(matchId: string, score1: number, score2: number) {
    return recordMatchResultService(matchId, score1, score2);
  }
}