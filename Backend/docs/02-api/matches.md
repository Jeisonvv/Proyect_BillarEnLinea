# API Matches

Base path: /api/matches

## Endpoints publicos

### GET /api/matches/tournament/:id

Lista los partidos de un torneo.

### GET /api/matches/:id

Devuelve el detalle de un partido.

## Endpoint administrativo

### POST /api/matches/:id/result

Acceso: ADMIN, STAFF

Payload:

```json
{
  "score1": 25,
  "score2": 19
}
```

Respuesta tipica:

```json
{
  "ok": true,
  "message": "Resultado registrado. El ganador avanzo al siguiente partido.",
  "data": {
    "winner": "6800abcd1234abcd1234abcd"
  }
}
```