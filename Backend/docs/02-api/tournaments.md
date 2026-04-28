# API Tournaments

Base path: /api/tournaments

## Resumen

Este modulo gestiona el catalogo de torneos, la inscripcion de jugadores, el checkout de Wompi, la administracion de grupos y la generacion de brackets.

## Endpoints publicos

### GET /api/tournaments

Query:

- status
- format
- page
- limit

Ejemplo:

```http
GET /api/tournaments?status=OPEN&page=1&limit=20
```

### GET /api/tournaments/:id

### GET /api/tournaments/:id/registrations

Opcional: ?status=PENDING

### GET /api/tournaments/:id/bracket

### GET /api/tournaments/:id/results

### GET /api/tournaments/:id/group-standings

### GET /api/tournaments/:id/adjustment-round

## Endpoints privados de cliente autenticado

### POST /api/tournaments/:id/register-self

Acceso: usuario autenticado

Notas:

- No acepta handicap para CUSTOMER.
- Si el torneo tiene costo y la categoria ya esta definida, puede devolver requiresPayment=true.
- Si la categoria del jugador es SIN_DEFINIR, la inscripcion puede quedar pendiente de confirmacion administrativa.

Payload tipico:

```json
{
  "channel": "WEB",
  "notes": "Me inscribo desde la web"
}
```

### POST /api/tournaments/:id/wompi/checkout

Acceso: usuario autenticado

Payload tipico:

```json
{
  "channel": "WEB",
  "notes": "Pago de inscripcion"
}
```

## Endpoints administrativos

### POST /api/tournaments

Acceso: ADMIN, STAFF

Payload minimo recomendado:

```json
{
  "name": "Copa Billar en Linea",
  "format": "GROUPS_AND_ELIMINATION",
  "formatDetails": "Grupos de 3, clasifican 2 por grupo y luego cuadro de eliminacion directa.",
  "status": "OPEN",
  "startDate": "2026-05-20T09:00:00.000Z",
  "registrationDeadline": "2026-05-18T23:59:59.000Z",
  "entryFee": 50000,
  "maxParticipants": 32,
  "playersPerGroup": 3,
  "withHandicap": false
}
```

Valores validos para format:

- SINGLE_ELIMINATION
- DOUBLE_ELIMINATION
- GROUPS
- GROUPS_AND_ELIMINATION
- ROUND_ROBIN
- SWISS

### DELETE /api/tournaments/:id

Acceso: ADMIN, STAFF

Elimina el torneo y su informacion relacionada:

- grupos
- partidos de grupos y eliminacion
- inscripciones
- transacciones de pago ligadas a inscripciones del torneo

### POST /api/tournaments/:id/register

Acceso: ADMIN, STAFF

Payload:

```json
{
  "userId": "6800abcd1234abcd1234abcd",
  "playerCategory": "PRIMERA",
  "channel": "WHATSAPP",
  "notes": "Inscripcion manual"
}
```

### PATCH /api/tournaments/:id/registrations/:userId/handicap

Acceso: ADMIN, STAFF

```json
{
  "handicap": 8
}
```

### GET /api/tournaments/:id/pending-payments

Acceso: ADMIN, STAFF

### POST /api/tournaments/:id/generate-bracket

### POST /api/tournaments/:id/groups

Payload:

```json
{
  "groups": [
    {
      "name": "Grupo A",
      "players": [
        "6800abcd1234abcd1234ab01",
        "6800abcd1234abcd1234ab02",
        "6800abcd1234abcd1234ab03"
      ],
      "tableNumber": 1,
      "advanceCount": 2
    }
  ]
}
```

### POST /api/tournaments/:id/add-groups

### POST /api/tournaments/:id/groups/:groupId/add-player

```json
{
  "userId": "6800abcd1234abcd1234abcd"
}
```

### POST /api/tournaments/:id/auto-groups

```json
{
  "playersPerGroup": 3
}
```

### POST /api/tournaments/:id/generate-adjustment-round

### POST /api/tournaments/:id/generate-bracket-from-groups

### POST /api/tournaments/:id/notify-groups