# Frontend Billar en Linea

Proyecto base en Next.js para el frontend de Billar en Linea.

## Entorno local

1. Copia .env.example a .env.local.
2. Verifica que NEXT_PUBLIC_API_BASE_URL apunte al backend local.
3. Ejecuta npm run dev.

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
