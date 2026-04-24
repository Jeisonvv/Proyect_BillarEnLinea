import { Injectable } from '@nestjs/common';
import {
  createTransmissionService,
  deleteTransmissionService,
  findAllTransmissions,
  findTransmissionById,
  updateTransmissionService,
} from '../../services/transmission.service.js';
import type { CreateTransmissionDto, UpdateTransmissionDto } from './dto/transmissions.dto.js';

@Injectable()
export class TransmissionsNestService {
  getTransmissions() {
    return findAllTransmissions();
  }

  getTransmission(id: string) {
    return findTransmissionById(id);
  }

  createTransmission(data: CreateTransmissionDto) {
    return createTransmissionService(data);
  }

  updateTransmission(id: string, data: UpdateTransmissionDto) {
    return updateTransmissionService(id, data);
  }

  deleteTransmission(id: string) {
    return deleteTransmissionService(id);
  }
}