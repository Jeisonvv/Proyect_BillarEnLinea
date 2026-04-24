# Overview

## Que es este proyecto

Backend para Billar en Linea. Centraliza autenticacion, usuarios, torneos, rifas, blog, eventos, transmisiones, pagos e integracion con bot.

## Stack actual

- Node 20
- TypeScript
- NestJS sobre ExpressAdapter
- Mongoose para MongoDB
- JWT para autenticacion
- Cookies httpOnly para cliente web
- X-Bot-Token para integraciones tecnicas del bot
- Wompi como proveedor de pagos

## Modulos principales

- Auth: registro, login, recuperacion de contrasena y logout.
- Users: administracion de usuarios, consulta por telefono y flujo conversacional del bot.
- Tournaments: torneos, inscripciones, grupos, brackets, pagos pendientes y resultados.
- Raffles: rifas, numeros, tickets, checkout y sorteo.
- Matches: consulta de partidos y carga de resultados.
- Events: calendario de eventos.
- Posts: blog y panel administrativo de publicaciones.
- Transmissions: solicitudes de transmision.
- Payments: webhook de Wompi.
- Lead Sessions: sesiones temporales del bot antes de promover a usuario persistido.

## Principios de diseno actuales

- Controladores Nest exponen la API.
- Servicios de dominio contienen la logica de negocio.
- Mongoose concentra persistencia y modelos.
- ValidationPipe valida DTOs al entrar.
- AuthGuard y RolesGuard protegen rutas privadas web.
- BotGuard protege rutas tecnicas del bot.

## Endpoints base del sistema

### Salud de la API

```http
GET /
GET /health
```

Ejemplo de respuesta de salud:

```json
{
  "ok": true,
  "status": "ok",
  "service": "backendbillarenlinea",
  "uptimeSeconds": 123,
  "timestamp": "2026-04-22T22:00:00.000Z",
  "checks": {
    "mongo": "connected"
  }
}
```