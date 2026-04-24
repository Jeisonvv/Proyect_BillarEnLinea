import { Body, Controller, HttpException, HttpStatus, Headers, Post } from '@nestjs/common';
import { PaymentsNestService } from './payments.service.js';

@Controller('api/payments')
export class PaymentsNestController {
  constructor(private readonly paymentsService: PaymentsNestService) {}

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