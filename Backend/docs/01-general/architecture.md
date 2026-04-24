# Arquitectura

## Vista general

El backend corre sobre NestJS pero reutiliza un pipeline Express compartido mediante ExpressAdapter.

## Flujo de arranque

1. main.ts carga variables de entorno.
2. main.ts valida variables criticas del runtime.
3. Se conecta MongoDB.
4. Se crea la app Express compartida.
5. Nest monta AppModule sobre ExpressAdapter.
6. ValidationPipe queda habilitado globalmente.
7. Nest habilita shutdown hooks para cierre ordenado.

## Pipeline HTTP

La app Express compartida se usa para:

- helmet
- cors con credentials
- rate limiting general
- parseo JSON y urlencoded
- sanitizacion Mongo
- request id por peticion
- logging HTTP estructurado
- GET /
- GET /health
- manejo global de errores

## Guardas de acceso

- AuthGuard: exige JWT desde cookie o Authorization Bearer.
- RolesGuard: valida roles ADMIN o STAFF segun metadata de cada endpoint.
- BotGuard: exige X-Bot-Token para integraciones internas del bot.

## Capas del proyecto

- src/modules: controladores, servicios Nest y DTOs.
- src/services: logica de negocio reutilizable.
- src/models: modelos Mongoose y enums compartidos.
- src/common: guardas y decoradores.
- src/utils: auth token, logger y utilidades auxiliares.
- src/middlewares: rate limiting y error handler.

## Persistencia

MongoDB se usa para:

- usuarios
- torneos
- inscripciones a torneos
- grupos de torneo
- partidos
- rifas
- tickets y numeros de rifa
- posts
- eventos
- solicitudes de transmision
- tokens revocados
- transacciones de pago
- sesiones temporales del bot