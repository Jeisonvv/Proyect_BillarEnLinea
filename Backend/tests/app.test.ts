import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { HttpException } from '@nestjs/common';
import { createExpressApp } from '../src/app.js';
import { RafflesNestController } from '../src/modules/raffles/raffles.controller.js';
import {
	assertRaffleSalesOpen,
	getRaffleReservationExpiration,
	getRaffleSaleStatus,
	getRaffleSalesDeadline,
	RaffleSalesClosedError,
	withRaffleSaleClosesAt,
} from '../src/utils/raffle-sale-window.js';
import { resolveProductSelection } from '../src/utils/store-inventory.js';
import { resolveOrderPaymentTransition } from '../src/utils/order-payment.js';
import { getOrderInventoryReservationExpiresAt, shouldBlockLateOrderApproval, shouldReleaseOrderInventoryReservation } from '../src/utils/order-inventory-reservation.js';
import { parseTrustProxySetting, validateRuntimeEnv } from '../src/utils/runtime-env.js';
import { OrderStatus, PaymentTransactionStatus } from '../src/models/enums.js';
import { getReservationCleanupIntervalMs } from '../src/modules/payments/payment-reservation-cleanup.worker.js';

test('GET / responde con estado saludable de la API', async () => {
	const app = createExpressApp();

	const response = await request(app).get('/');

	assert.equal(response.status, 200);
	assert.equal(response.body.ok, true);
	assert.match(response.body.message, /API Billar en Línea funcionando/);
	assert.ok(response.headers['x-request-id']);
});

test('GET /health expone el estado actual de MongoDB', async () => {
	const app = createExpressApp();

	const response = await request(app).get('/health');

	assert.equal(response.status, 503);
	assert.equal(response.body.ok, false);
	assert.equal(response.body.service, 'backendbillarenlinea');
	assert.equal(typeof response.body.checks?.mongo, 'string');
	assert.ok(response.headers['x-request-id']);
});

test('la ventana de venta de rifas expone saleClosesAt y recorta reservas al limite', () => {
	const drawDate = new Date('2026-05-03T03:40:00.000Z');
	const now = new Date('2026-05-03T02:55:00.000Z');

	const deadline = getRaffleSalesDeadline(drawDate);
	const raffle = withRaffleSaleClosesAt({ drawDate, name: 'Rifa Mayo' });
	const reservationExpiration = getRaffleReservationExpiration(drawDate, 15, now);

	assert.equal(deadline.toISOString(), '2026-05-03T03:00:00.000Z');
	assert.equal(raffle.saleClosesAt, '2026-05-03T03:00:00.000Z');
	assert.equal(raffle.saleStatus, 'OPEN');
	assert.equal(reservationExpiration.toISOString(), '2026-05-03T03:00:00.000Z');
});

test('saleStatus cambia a CLOSED al llegar al limite de venta', () => {
	const drawDate = new Date('2026-05-03T03:40:00.000Z');
	const now = new Date('2026-05-03T03:00:00.000Z');

	assert.equal(getRaffleSaleStatus(drawDate, now), 'CLOSED');
	assert.equal(withRaffleSaleClosesAt({ drawDate }, now).saleStatus, 'CLOSED');
});

test('el cierre de venta lanza un error estructurado con la hora limite', () => {
	const drawDate = new Date('2026-05-03T03:40:00.000Z');
	const now = new Date('2026-05-03T03:00:00.000Z');

	assert.throws(() => assertRaffleSalesOpen(drawDate, now), (error: unknown) => {
		assert.ok(error instanceof RaffleSalesClosedError);
		assert.equal(error.code, 'RAFFLE_SALES_CLOSED');
		assert.equal(error.saleClosesAt, '2026-05-03T03:00:00.000Z');
		assert.equal(error.timezone, 'America/Bogota');
		return true;
	});
});

test('el controlador de rifas devuelve error estructurado cuando la venta ya cerro', async () => {
	const drawDate = new Date('2026-05-03T03:40:00.000Z');
	const closedError = new RaffleSalesClosedError(getRaffleSalesDeadline(drawDate));
	const controller = new RafflesNestController({
		purchaseRaffleTickets: async () => {
			throw closedError;
		},
	} as any);

	await assert.rejects(
		async () => controller.purchaseRaffleTickets({ user: { id: 'user-1', role: 'CUSTOMER' } } as any, 'raffle-1', {} as any),
		(error: unknown) => {
			assert.ok(error instanceof HttpException);
			assert.equal(error.getStatus(), 400);
			assert.deepEqual(error.getResponse(), {
				ok: false,
				message: closedError.message,
				code: 'RAFFLE_SALES_CLOSED',
				saleClosesAt: '2026-05-03T03:00:00.000Z',
				timezone: 'America/Bogota',
			});
			return true;
		},
	);
});

test('el inventario resuelve stock y precio para productos simples', () => {
	const result = resolveProductSelection({
		name: 'Guante profesional',
		basePrice: 45000,
		stock: 4,
		isActive: true,
		variants: [],
	}, {
		quantity: 2,
	});

	assert.deepEqual(result, {
		unitPrice: 45000,
		subtotal: 90000,
		stockAdjustment: {
			quantity: 2,
		},
	});
});

test('el inventario rechaza stock insuficiente en productos simples', () => {
	assert.throws(() => resolveProductSelection({
		name: 'Tiza premium',
		basePrice: 10000,
		stock: 1,
		isActive: true,
		variants: [],
	}, {
		quantity: 2,
	}), /Stock insuficiente para Tiza premium/);
});

test('la transición de pagos mantiene el pedido pendiente cuando Wompi vence o falla', () => {
	assert.equal(
		resolveOrderPaymentTransition(OrderStatus.PENDING, PaymentTransactionStatus.EXPIRED),
		'keep-pending',
	);

	assert.equal(
		resolveOrderPaymentTransition(OrderStatus.PENDING, PaymentTransactionStatus.ERROR),
		'keep-pending',
	);
});

test('la transición de pagos bloquea aprobaciones sobre pedidos cancelados y confirma pendientes', () => {
	assert.equal(
		resolveOrderPaymentTransition(OrderStatus.CANCELLED, PaymentTransactionStatus.APPROVED),
		'blocked',
	);

	assert.equal(
		resolveOrderPaymentTransition(OrderStatus.PENDING, PaymentTransactionStatus.APPROVED),
		'mark-paid',
	);
});

test('la reserva temporal de inventario para pedidos calcula una expiración futura', () => {
	const now = new Date('2026-04-24T15:00:00.000Z');
	const expiresAt = getOrderInventoryReservationExpiresAt(now, 30);

	assert.equal(expiresAt.toISOString(), '2026-04-24T15:30:00.000Z');
});

test('la reserva bloquea aprobaciones tardías cuando el inventario ya fue liberado', () => {
	assert.equal(
		shouldBlockLateOrderApproval({
			orderStatus: OrderStatus.PENDING,
			paymentStatus: PaymentTransactionStatus.APPROVED,
			inventoryReleasedAt: new Date('2026-04-24T15:31:00.000Z'),
		}),
		true,
	);
});

test('la reserva libera inventario cuando el checkout vence o falla', () => {
	assert.equal(
		shouldReleaseOrderInventoryReservation({
			orderStatus: OrderStatus.PENDING,
			paymentStatus: PaymentTransactionStatus.EXPIRED,
			inventoryReservedUntil: new Date('2026-04-24T15:30:00.000Z'),
		}),
		true,
	);

	assert.equal(
		shouldReleaseOrderInventoryReservation({
			orderStatus: OrderStatus.PENDING,
			paymentStatus: PaymentTransactionStatus.ERROR,
			inventoryReleasedAt: new Date('2026-04-24T15:31:00.000Z'),
		}),
		false,
	);
});

test('el intervalo del worker de cleanup usa un mínimo seguro y acepta configuración válida', () => {
	const previousValue = process.env.PAYMENT_RESERVATION_CLEANUP_INTERVAL_MS;

	process.env.PAYMENT_RESERVATION_CLEANUP_INTERVAL_MS = '2000';
	assert.equal(getReservationCleanupIntervalMs(), 60000);

	process.env.PAYMENT_RESERVATION_CLEANUP_INTERVAL_MS = '45000';
	assert.equal(getReservationCleanupIntervalMs(), 45000);

	if (previousValue === undefined) {
		delete process.env.PAYMENT_RESERVATION_CLEANUP_INTERVAL_MS;
	} else {
		process.env.PAYMENT_RESERVATION_CLEANUP_INTERVAL_MS = previousValue;
	}
});

test('trust proxy solo se activa cuando la configuración es explícita', () => {
	assert.equal(parseTrustProxySetting(undefined), false);
	assert.equal(parseTrustProxySetting(''), false);
	assert.equal(parseTrustProxySetting('true'), true);
	assert.equal(parseTrustProxySetting('1'), 1);
	assert.equal(parseTrustProxySetting('loopback'), 'loopback');
});

test('la validación de entorno falla temprano con Wompi incompleto y acepta configuración completa', () => {
	assert.throws(() => validateRuntimeEnv({
		MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
		JWT_SECRET: 'secret',
		WOMPI_PUBLIC_KEY: 'pub_test',
	}), /La configuración de Wompi está incompleta/);

	assert.doesNotThrow(() => validateRuntimeEnv({
		MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
		JWT_SECRET: 'secret',
		WOMPI_PUBLIC_KEY: 'pub_test',
		WOMPI_INTEGRITY_SECRET: 'int_test',
		WOMPI_EVENTS_SECRET: 'evt_test',
	}));

	assert.doesNotThrow(() => validateRuntimeEnv({
		MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
		JWT_SECRET: 'secret',
	}));
});