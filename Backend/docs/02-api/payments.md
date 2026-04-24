# API Payments

Base path: /api/payments

## Resumen

El backend no expone un CRUD general de pagos. El endpoint publico principal del modulo es el webhook de Wompi.

## Endpoint

### POST /api/payments/wompi/webhook

Acceso: publico tecnico

Header esperado:

```http
X-Event-Checksum: CHECKSUM_ENVIADO_POR_WOMPI
```

Payload: evento enviado por Wompi.

Comportamiento:

- valida checksum
- ubica la transaccion interna
- compara monto
- normaliza estado del pago
- actualiza la compra o inscripcion asociada

Errores comunes:

- 400 si el checksum es invalido
- 400 si el payload no corresponde a una transaccion valida