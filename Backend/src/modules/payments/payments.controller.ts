import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { PaymentsNestService } from './payments.service.js';

@Controller('api/payments')
export class PaymentsNestController {
  constructor(private readonly paymentsService: PaymentsNestService) {}

  @Get('wompi/tournaments/return')
  async getTournamentWompiReturn(@Query('reference') reference?: string) {
    if (!reference?.trim()) {
      throw new HttpException({ ok: false, message: 'La referencia del pago es obligatoria.' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const data = await this.paymentsService.getTournamentWompiReturn(reference);
      return { ok: true, data };
    } catch (error: any) {
      const status = ['Pago no encontrado.', 'Inscripción no encontrada.', 'Torneo no encontrado.'].includes(error.message)
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get('wompi/activities/return')
  async getActivityWompiReturn(@Query('reference') reference?: string) {
    if (!reference?.trim()) {
      throw new HttpException({ ok: false, message: 'La referencia del pago es obligatoria.' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const data = await this.paymentsService.getActivityWompiReturn(reference);
      return { ok: true, data };
    } catch (error: any) {
      const status = ['Pago no encontrado.', 'Ticket no encontrado.', 'Actividad no encontrada.'].includes(error.message)
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Get('wompi/orders/return')
  async getOrderWompiReturn(@Query('reference') reference?: string) {
    if (!reference?.trim()) {
      throw new HttpException({ ok: false, message: 'La referencia del pago es obligatoria.' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const data = await this.paymentsService.getOrderWompiReturn(reference);
      return { ok: true, data };
    } catch (error: any) {
      const status = ['Pago no encontrado.', 'Pedido no encontrado.'].includes(error.message)
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      throw new HttpException({ ok: false, message: error.message }, status);
    }
  }

  @Post('wompi/webhook')
  async handleWompiWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-event-checksum') eventChecksum?: string | string[],
  ) {
    try {
      return await this.paymentsService.handleWompiWebhook(body, eventChecksum);
    } catch (error: any) {
      throw new HttpException({ ok: false, message: error.message }, HttpStatus.BAD_REQUEST);
    }
  }
}