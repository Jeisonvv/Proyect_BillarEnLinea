# API Raffles

Base path: /api/raffles

## Resumen

Gestiona rifas, consulta de numeros, compra de tickets, checkout de pagos y sorteo final.

Regla de venta:

- La venta de tickets se cierra 40 minutos antes de drawDate.
- El cierre se interpreta en hora Colombia.
- La compra directa y el checkout de Wompi respetan ese mismo limite.
- Las respuestas de rifa exponen saleClosesAt y saleStatus para facilitar el frontend.

Metadata de venta:

- saleClosesAt: fecha ISO exacta en que se cierra la venta.
- saleStatus: OPEN o CLOSED segun la hora actual del servidor frente al limite.

## Endpoints publicos

### GET /api/raffles

Query:

- status
- page
- limit

### GET /api/raffles/:id

### GET /api/raffles/:id/numbers

Query:

- status
- page
- limit

### GET /api/raffles/:id/available-numbers

Respuesta conceptual:

- Incluye availableCount, numbers, saleClosesAt y saleStatus.

## Endpoints privados de cliente autenticado

### POST /api/raffles/:id/tickets

Acceso: usuario autenticado

Payload tipico:

```json
{
  "numbers": [7, 15, 23],
  "channel": "WEB"
}
```

Error estructurado cuando la venta ya cerro:

```json
{
  "ok": false,
  "message": "La venta de boletos cerró el 2 de mayo de 2026, 10:00 p. m. hora Colombia.",
  "code": "RAFFLE_SALES_CLOSED",
  "saleClosesAt": "2026-05-03T03:00:00.000Z",
  "timezone": "America/Bogota"
}
```

### POST /api/raffles/:id/wompi/checkout

Acceso: usuario autenticado

Payload:

```json
{
  "numbers": [7, 15, 23],
  "channel": "WEB"
}
```

Respuesta conceptual:

- Incluye reservationExpiresAt.
- Incluye saleClosesAt y saleStatus para sincronizar el cierre de venta con frontend.

## Endpoints administrativos

### POST /api/raffles

Acceso: ADMIN, STAFF

Payload minimo recomendado:

```json
{
  "name": "Rifa Taco Profesional",
  "prize": "Taco Predator",
  "ticketPrice": 10000,
  "totalTickets": 100,
  "drawDate": "2026-05-03T03:40:00.000Z"
}
```

Notas:

- drawDate es obligatorio.
- Debe incluir fecha y hora exactas del cierre final de la rifa o del sorteo.
- En la practica conviene enviarlo en formato ISO 8601.
- Ejemplo: 2 de mayo de 2026 a las 10:40 p. m. hora Colombia equivale a 2026-05-03T03:40:00.000Z.

### GET /api/raffles/:id/number-owners

Acceso: ADMIN, STAFF

### POST /api/raffles/:id/draw

Acceso: ADMIN, STAFF

Payload:

```json
{
  "winningNumber": "07"
}
```

Comportamiento:

- El administrador o staff define manualmente el numero ganador.
- El sistema valida que ese numero pertenezca a la rifa.
- Si ese numero esta pagado y tiene usuario asociado, marca el numero, el ticket y la rifa con ganador.
- Si ese numero no fue vendido, la rifa queda sorteada sin ganador, pero conserva winnerTicket con el numero seleccionado.
- Si ese numero estaba reservado pero no pagado, tambien queda la rifa sin ganador.
- La rifa ahora expone hasWinner para distinguir rapidamente si hubo usuario ganador o no.

Respuesta conceptual:

- Con ganador: message indica que hubo ganador asignado y hasWinner=true.
- Sin ganador: message indica que el numero se registro sin usuario asignado y hasWinner=false.

### DELETE /api/raffles/:id

Acceso: ADMIN, STAFF