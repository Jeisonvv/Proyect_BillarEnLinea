# API Users

Base path: /api/users

## Resumen

Incluye administracion de usuarios para staff y endpoints tecnicos usados por el bot para buscar usuarios y manipular estado conversacional.

## Endpoints administrativos

### POST /api/users

Acceso: ADMIN, STAFF

Payload tipico:

```json
{
  "name": "Carlos Gomez",
  "email": "carlos@example.com",
  "phone": "+573009998877",
  "identityDocument": "987654321",
  "role": "CUSTOMER",
  "playerCategory": "SIN_DEFINIR"
}
```

### GET /api/users

Acceso: ADMIN, STAFF

Query soportada:

- status
- role
- playerCategory
- search
- page
- limit

Ejemplo:

```http
GET /api/users?role=CUSTOMER&search=juan&page=1&limit=20
```

### GET /api/users/by-phone/:phone

Acceso: ADMIN, STAFF

### GET /api/users/:id

Acceso: ADMIN, STAFF

### PATCH /api/users/:id

Acceso: ADMIN, STAFF

Payload tipico:

```json
{
  "name": "Carlos Gomez Actualizado",
  "playerCategory": "PRIMERA",
  "status": "CLIENT"
}
```

### DELETE /api/users/:id

Acceso: solo ADMIN

Comportamiento: soft delete.

## Endpoints tecnicos del bot

Todos requieren:

```http
X-Bot-Token: TU_BOT_API_KEY
```

### GET /api/users/by-provider/:provider/:providerId

Ejemplo:

```http
GET /api/users/by-provider/WHATSAPP/573001234567
```

### GET /api/users/:id/conversation-state

Ejemplo:

```http
GET /api/users/6800abcd1234abcd1234abcd/conversation-state?channel=WHATSAPP
```

### PUT /api/users/:id/conversation-state

Payload:

```json
{
  "channel": "WHATSAPP",
  "currentState": "IDLE",
  "stateData": {
    "step": "menu_principal"
  }
}
```