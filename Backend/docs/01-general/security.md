# Seguridad y acceso

## Autenticacion web

El login web guarda un JWT en cookie httpOnly. AuthGuard tambien acepta Authorization Bearer para pruebas manuales o clientes tecnicos.

## Autenticacion del bot

El bot usa X-Bot-Token. Algunas rutas tecnicas ademas pueden usar login con token devuelto en body.

## Roles

- CUSTOMER: cliente final
- STAFF: operador del negocio
- ADMIN: control total

## Tipos de rutas

### Publicas

- catalogo de torneos, rifas, partidos, eventos y posts
- auth publico
- webhook de pagos
- healthcheck

### Privadas web

Protegidas por AuthGuard y, cuando aplica, RolesGuard.

### Privadas bot

Protegidas por BotGuard y X-Bot-Token.

## Validacion de entrada

La API usa ValidationPipe global con:

- transform=true
- whitelist=true
- forbidNonWhitelisted=true
- forbidUnknownValues=true

Esto significa que el backend rechaza campos no declarados y payloads desconocidos.

## Logging y trazabilidad

- Cada request recibe X-Request-Id.
- Los logs HTTP y de error salen en JSON.
- GET /health registra informacion util para monitoreo.

## Ejemplos de headers

### Web manual con bearer

```http
Authorization: Bearer TU_JWT
```

### Bot

```http
X-Bot-Token: TU_BOT_API_KEY
```

### Webhook Wompi

```http
X-Event-Checksum: CHECKSUM_ENVIADO_POR_WOMPI
```