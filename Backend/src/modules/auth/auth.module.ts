import { Module, RequestMethod } from '@nestjs/common';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthNestController } from './auth.controller.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { AuthNestService } from './auth.service.js';

@Module({
  controllers: [AuthNestController],
  providers: [AuthNestService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authLimiter).forRoutes(
      { path: 'api/auth/register', method: RequestMethod.POST },
      { path: 'api/auth/login', method: RequestMethod.POST },
      { path: 'api/auth/bot-login', method: RequestMethod.POST },
      { path: 'api/auth/forgot-password', method: RequestMethod.POST },
      { path: 'api/auth/reset-password', method: RequestMethod.POST },
    );
  }
}