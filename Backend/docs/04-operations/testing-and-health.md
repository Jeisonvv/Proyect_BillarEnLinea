# Testing y health

## Pruebas automatizadas actuales

Script:

```bash
npm test
```

Hoy cubre smoke tests del pipeline HTTP:

- GET /
- GET /health

Tambien cubre reglas criticas del dominio:

- Cierre de ventas de rifas y error estructurado asociado.
- Resolucion de inventario para productos simples.
- Transiciones de pedido frente a pagos Wompi aprobados, vencidos o fallidos.
- Vencimiento de la reserva temporal de inventario en pedidos.
- Configuración mínima segura del worker automático de cleanup.

## Build de validacion

```bash
npm run build
```

Uso recomendado antes de desplegar:

1. npm test
2. npm run build

## Healthcheck

Ruta:

```http
GET /health
```

Semantica:

- 200 si MongoDB esta conectado
- 503 si el proceso esta vivo pero Mongo no esta listo

Respuesta:

```json
{
  "ok": false,
  "status": "degraded",
  "service": "backendbillarenlinea",
  "uptimeSeconds": 12,
  "timestamp": "2026-04-22T22:00:00.000Z",
  "checks": {
    "mongo": "disconnected"
  }
}
```

## Logging

El backend registra:

- http_request en JSON
- request_error en JSON
- requestId por peticion

Esto facilita correlacion de errores y diagnostico en produccion.

Adicionalmente, el backend registra eventos del worker de reservas:

- payment_reservation_cleanup_started
- payment_reservation_cleanup_completed
- payment_reservation_cleanup_failed
- payment_reservation_cleanup_stopped