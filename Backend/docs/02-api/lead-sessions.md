# API Lead Sessions

Base path: /api/lead-sessions

## Resumen

Modulo tecnico del bot para sesiones temporales antes de promover un lead a usuario persistido.

## Seguridad

Todas las rutas requieren:

```http
X-Bot-Token: TU_BOT_API_KEY
```

## Endpoints

### POST /api/lead-sessions

Payload:

```json
{
  "channel": "WHATSAPP",
  "providerId": "573001234567",
  "currentState": "NEW",
  "stateData": {
    "step": "welcome"
  },
  "leadData": {
    "name": "Juan Perez"
  },
  "qualified": false
}
```

### GET /api/lead-sessions/:channel/:providerId

### PUT /api/lead-sessions/:channel/:providerId/state

```json
{
  "currentState": "QUALIFIED",
  "stateData": {
    "source": "bot_menu"
  }
}
```

### PATCH /api/lead-sessions/:channel/:providerId/data

```json
{
  "leadData": {
    "phone": "+573001234567",
    "interest": "TOURNAMENTS"
  },
  "qualified": true,
  "status": "QUALIFIED"
}
```

### POST /api/lead-sessions/:channel/:providerId/promote

Promueve la sesion temporal a entidad persistida cuando el lead ya esta listo.