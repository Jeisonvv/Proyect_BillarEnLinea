# Integracion Wompi

## Variables requeridas

```env
WOMPI_PUBLIC_KEY=
WOMPI_INTEGRITY_SECRET=
WOMPI_EVENTS_SECRET=
WOMPI_REDIRECT_URL=http://localhost:5173/payments/wompi
WOMPI_RAFFLES_REDIRECT_URL=http://localhost:5173/payments/wompi/raffles
WOMPI_TOURNAMENTS_REDIRECT_URL=http://localhost:5173/payments/wompi/tournaments
```

## Flujos soportados

- Checkout de rifas
- Checkout de inscripciones a torneos
- Webhook de confirmacion de pagos

## Desde rifas

Ruta principal:

```http
POST /api/raffles/:id/wompi/checkout
```

Ejemplo:

```json
{
  "numbers": [12, 44, 88],
  "channel": "WEB"
}
```

## Desde torneos

Ruta principal:

```http
POST /api/tournaments/:id/wompi/checkout
```

Ejemplo:

```json
{
  "channel": "WEB",
  "notes": "Pago de inscripcion"
}
```

## Webhook

Wompi debe apuntar a:

```http
POST /api/payments/wompi/webhook
```

El backend valida checksum, integridad y monto antes de confirmar la transaccion interna.