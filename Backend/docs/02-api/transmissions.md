# API Transmissions

Base path: /api/transmissions

## Estado actual de acceso

Todo el controlador esta protegido con AuthGuard y RolesGuard. En la practica, todos los endpoints de transmisiones son privados y ademas las operaciones de escritura exigen ADMIN o STAFF.

## Endpoints

### GET /api/transmissions

Acceso: autenticado

### GET /api/transmissions/:id

Acceso: autenticado

### POST /api/transmissions

Acceso: ADMIN, STAFF

Payload tipico:

```json
{
  "name": "Transmision Final Open 2026",
  "description": "Solicitud para cubrir la final del torneo"
}
```

### PUT /api/transmissions/:id

Acceso: ADMIN, STAFF

```json
{
  "name": "Transmision Final Open 2026",
  "description": "Actualizacion de horarios y requerimientos"
}
```

### DELETE /api/transmissions/:id

Acceso: ADMIN, STAFF