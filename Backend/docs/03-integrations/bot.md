# Integracion Bot

## Objetivo

Permitir que el bot consulte usuarios, lea y actualice estado conversacional, administre lead sessions y, si hace login tecnico, consuma rutas protegidas con JWT.

## Credenciales necesarias

### Backend

```env
BOT_API_KEY=tu_clave_tecnica
JWT_SECRET=tu_secreto_jwt
```

### Bot

```env
BACKEND_URL=http://localhost:3000
BOT_LOGIN_EMAIL=bot@billarenlinea.com
BOT_LOGIN_PASSWORD=ClaveBot123
BOT_API_KEY=tu_clave_tecnica
```

## Formas de acceso del bot

### 1. Rutas tecnicas con X-Bot-Token

Usadas para:

- GET /api/users/by-provider/:provider/:providerId
- GET /api/users/:id/conversation-state
- PUT /api/users/:id/conversation-state
- todo /api/lead-sessions/*

### 2. Login tecnico para obtener JWT

Rutas:

- POST /api/auth/login con X-Bot-Token
- POST /api/auth/bot-login con X-Bot-Token

Ejemplo:

```http
POST /api/auth/bot-login
Content-Type: application/json
X-Bot-Token: TU_BOT_API_KEY

{
  "email": "bot@billarenlinea.com",
  "password": "ClaveBot123"
}
```

## Flujo recomendado

1. Buscar usuario por provider.
2. Si no existe, usar lead-sessions.
3. Actualizar estados durante la conversacion.
4. Promover cuando el lead ya esta calificado.
5. Si necesitas endpoints web privados, autenticar el bot y reutilizar Authorization Bearer.