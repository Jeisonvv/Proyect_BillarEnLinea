# Frontend Billar en Linea

Proyecto base en Next.js para el frontend de Billar en Linea.

## Entorno local

1. Copia .env.example a .env.local.
2. Verifica que NEXT_PUBLIC_API_BASE_URL apunte al backend local.
3. Ejecuta npm run dev.

Variables opcionales para redes sociales:

- NEXT_PUBLIC_FACEBOOK_APP_ID: agrega el ID de tu app de Facebook para eliminar la advertencia de fb:app_id en Sharing Debugger.
- NEXT_PUBLIC_SOCIAL_IMAGE_VERSION: versiona la URL de og:image para forzar refresco de cache en Facebook/WhatsApp/X tras un despliegue.

El frontend arranca en http://localhost:3000 para no chocar con el backend en http://localhost:3001.

## Estado inicial

La home actual consulta:

- GET /
- GET /health

Esto permite validar rápido que el backend está arriba mientras montas el resto de pantallas.

## Scripts

- npm run dev
- npm run build
- npm run start
- npm run lint
