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
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../models/enums.js';
import type { CreateTransmissionDto, UpdateTransmissionDto } from './dto/transmissions.dto.js';
import { TransmissionsNestService } from './transmissions.service.js';

@Controller('api/transmissions')
@UseGuards(AuthGuard, RolesGuard)
export class TransmissionsNestController {
  constructor(private readonly transmissionsService: TransmissionsNestService) {}

  @Get()
  async getTransmissions() {
    try {
      const requests = await this.transmissionsService.getTransmissions();
      return { ok: true, requests };
    } catch (error: any) {
      throw new HttpException(
        { ok: false, message: error.message || 'Error al obtener solicitudes de transmisión' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getTransmission(@Param('id') id: string) {
    if (!id) {
      throw new HttpException({ ok: false, message: 'ID de solicitud inválido' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const request = await this.transmissionsService.getTransmission(id);
      if (!request) {
        throw new HttpException({ ok: false, message: 'Solicitud de transmisión no encontrada' }, HttpStatus.NOT_FOUND);
      }

      return { ok: true, request };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { ok: false, message: error.message || 'Error al obtener solicitud de transmisión' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createTransmission(@Body() body: CreateTransmissionDto) {
    try {
      const request = await this.transmissionsService.createTransmission(body);
      return { ok: true, request };
    } catch (error: any) {
      throw new HttpException(
        { ok: false, message: error.message || 'Error al crear solicitud de transmisión' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateTransmission(@Param('id') id: string, @Body() body: UpdateTransmissionDto) {
    if (!id) {
      throw new HttpException({ ok: false, message: 'ID de solicitud inválido' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const request = await this.transmissionsService.updateTransmission(id, body);
      if (!request) {
        throw new HttpException({ ok: false, message: 'Solicitud de transmisión no encontrada' }, HttpStatus.NOT_FOUND);
      }

      return { ok: true, request };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { ok: false, message: error.message || 'Error al actualizar solicitud de transmisión' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async deleteTransmission(@Param('id') id: string) {
    if (!id) {
      throw new HttpException({ ok: false, message: 'ID de solicitud inválido' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const request = await this.transmissionsService.deleteTransmission(id);
      if (!request) {
        throw new HttpException({ ok: false, message: 'Solicitud de transmisión no encontrada' }, HttpStatus.NOT_FOUND);
      }

      return { ok: true, message: 'Solicitud de transmisión eliminada' };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { ok: false, message: error.message || 'Error al eliminar solicitud de transmisión' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}