# API Auth

Base path: /api/auth

## Resumen

Gestiona registro web, login web, login de bot, recuperacion de contrasena y logout.

## Endpoints

### POST /api/auth/register

Acceso: publico

Payload minimo:

```json
{
  "name": "Juan Perez",
  "email": "juan@example.com",
  "password": "ClaveSegura123",
  "phone": "+573001234567",
  "identityDocument": "1234567890"
}
```

Respuesta tipica:

```json
{
  "ok": true,
  "data": {
    "id": "6800abcd1234abcd1234abcd",
    "name": "Juan Perez",
    "email": "juan@example.com",
    "identityDocument": "1234567890",
    "role": "CUSTOMER"
  }
}
```

Errores comunes:

- 400 si faltan name, email, phone, identityDocument o password.
- 409 si el email o documento ya existe.

### POST /api/auth/login

Acceso: publico

Payload:

```json
{
  "email": "juan@example.com",
  "password": "ClaveSegura123"
}
```

Comportamiento:

- Cliente web: guarda cookie httpOnly y devuelve payload del usuario.
- Cliente bot con X-Bot-Token valido: devuelve payload mas token en body.

### POST /api/auth/bot-login

Acceso: bot

Headers:

```http
X-Bot-Token: TU_BOT_API_KEY
```

Payload:

```json
{
  "email": "bot@billarenlinea.com",
  "password": "ClaveTecnica123"
}
```

### POST /api/auth/forgot-password

Acceso: publico

Payload:

```json
{
  "email": "juan@example.com"
}
```

### POST /api/auth/reset-password

Acceso: publico

Payload:

```json
{
  "token": "token_recibido_por_email",
  "password": "NuevaClave123"
}
```

### POST /api/auth/logout

Acceso: publico

Comportamiento:

- limpia cookie de autenticacion
- intenta invalidar el token actual si existe