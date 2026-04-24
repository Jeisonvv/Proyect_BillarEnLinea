# Despliegue

## Requisitos

- Node 20
- MongoDB accesible
- Variables de entorno configuradas
- dist generado con npm run build

## Arranque local o manual

```bash
npm install
npm run build
npm start
```

## Docker

Construccion:

```bash
docker build -t backendbillarenlinea .
```

Ejecucion:

```bash
docker run --env-file .env -p 3000:3000 backendbillarenlinea
```

## GitHub Actions

El workflow de CI corre:

1. npm ci
2. npm test
3. npm run build

## Variables minimas para produccion

- NODE_ENV=production
- PORT
- MONGODB_URI
- JWT_SECRET
- ALLOWED_ORIGINS
- FRONTEND_URL
- AUTH_COOKIE_SECURE=true en HTTPS
- TRUST_PROXY si el backend queda detras de Nginx, Cloudflare, Render, Railway o un balanceador
- BOT_API_KEY si existe integracion con bot
- variables Wompi si hay cobros activos

Variables Wompi recomendadas cuando esta activa la tienda:

- WOMPI_PUBLIC_KEY
- WOMPI_INTEGRITY_SECRET
- WOMPI_EVENTS_SECRET
- WOMPI_REDIRECT_URL
- WOMPI_RAFFLES_REDIRECT_URL
- WOMPI_TOURNAMENTS_REDIRECT_URL
- WOMPI_ORDERS_REDIRECT_URL
- ORDER_CHECKOUT_RESERVATION_MINUTES
- PAYMENT_RESERVATION_CLEANUP_ENABLED
- PAYMENT_RESERVATION_CLEANUP_INTERVAL_MS

## Recomendaciones de hosting

1. Exponer solo el puerto HTTP del backend.
2. Terminar TLS en proxy o balanceador.
3. Configurar TRUST_PROXY cuando aplique.
4. Usar GET /health como healthcheck del orquestador.
5. Verificar que los redirect URLs de Wompi apunten al frontend correcto de cada flujo.
6. Mantener activo el worker de cleanup de reservas o reemplazarlo por un scheduler externo equivalente.