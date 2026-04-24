# Documentacion Backend Billar en Linea

Esta carpeta contiene la documentacion funcional, tecnica y operativa del backend.

## Estructura

- 01-general
  - overview.md: vision general del proyecto, stack y modulos principales.
  - architecture.md: arquitectura actual basada en Nest + ExpressAdapter + Mongoose.
  - environment.md: variables de entorno, cookies, CORS y configuracion base.
  - security.md: autenticacion, roles, bot token, validacion y salud del sistema.
  - store-roadmap.md: estado actual de tienda y minimo faltante para lanzar productos y pedidos.
- 02-api
  - endpoints-overview.md
  - auth.md
  - cart.md
  - orders.md
  - products.md
  - users.md
  - tournaments.md
  - raffles.md
  - matches.md
  - events.md
  - posts.md
  - transmissions.md
  - payments.md
  - lead-sessions.md
- 03-integrations
  - bot.md
  - wompi.md
- 04-operations
  - deployment.md
  - testing-and-health.md
  - seeding-and-scripts.md

## Convenciones usadas en esta documentacion

- Base URL local: http://localhost:3000
- Todas las respuestas siguen el patron general ok + data o ok + message.
- Cuando una ruta es privada para web, acepta cookie httpOnly o Authorization Bearer.
- Cuando una ruta es tecnica para el bot, requiere el header X-Bot-Token.
- Los ejemplos muestran payloads tipicos, no necesariamente todos los campos opcionales soportados por el servicio.

## Mapa rapido de acceso

### Publico

- GET /
- GET /health
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/logout
- GET publicos de torneos, rifas, partidos, eventos y posts.
- POST /api/payments/wompi/webhook

### Privado web

- Gestion administrativa de usuarios
- Registro privado a torneos
- Compra de tickets o checkout de rifas
- CRUD administrativo de eventos, posts y rifas
- Todo el modulo de transmisiones

### Privado bot

- GET /api/users/by-provider/:provider/:providerId
- GET /api/users/:id/conversation-state
- PUT /api/users/:id/conversation-state
- Todo /api/lead-sessions/*

## Punto de entrada recomendado

Si vas a empezar desde cero, sigue este orden:

1. 01-general/overview.md
2. 01-general/environment.md
3. 01-general/security.md
4. 02-api/auth.md
5. El modulo API que necesites integrar
6. 03-integrations/* si vas a conectar bot o Wompi
7. 04-operations/* si vas a desplegar o mantener el backend