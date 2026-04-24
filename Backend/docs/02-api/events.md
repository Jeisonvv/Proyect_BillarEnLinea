# API Events

Base path: /api/events

## Endpoints publicos

### GET /api/events

Query:

- status
- type
- tier
- featured
- page
- limit

### GET /api/events/:id

## Endpoints administrativos

### POST /api/events

Acceso: ADMIN, STAFF

Payload tipico:

```json
{
  "name": "Open Nacional 2026",
  "type": "OPEN",
  "tier": "NATIONAL",
  "status": "SCHEDULED",
  "startDate": "2026-06-10T14:00:00.000Z",
  "endDate": "2026-06-12T23:00:00.000Z",
  "entryFee": 30000,
  "featured": true
}
```

### PUT /api/events/:id

### DELETE /api/events/:id