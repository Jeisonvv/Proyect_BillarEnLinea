import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { LeadSessionsModule } from './modules/lead-sessions/lead-sessions.module.js';
import { MatchesModule } from './modules/matches/matches.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { PostsModule } from './modules/posts/posts.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { RafflesModule } from './modules/raffles/raffles.module.js';
import { TournamentsModule } from './modules/tournaments/tournaments.module.js';
import { TransmissionsModule } from './modules/transmissions/transmissions.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
	imports: [
		AuthModule,
		CartModule,
		UsersModule,
		OrdersModule,
		TournamentsModule,
		PaymentsModule,
		RafflesModule,
		MatchesModule,
		EventsModule,
		ProductsModule,
		PostsModule,
		TransmissionsModule,
		LeadSessionsModule,
	],
})
export class AppModule {}