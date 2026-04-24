# Backend Billar en Linea

Backend del proyecto Billar en Linea.

## Documentacion

La documentacion operativa e integraciones esta organizada en la carpeta docs.

- Indice general: docs/README.md
- General: docs/01-general/
- API: docs/02-api/
- Integraciones: docs/03-integrations/
- Operacion: docs/04-operations/

## Produccion

Runtime soportado: Node 20.

Este proyecto ya puede compilarse para produccion con:

```bash
npm run build
```

El servidor de produccion debe arrancar con:

```bash
npm start
```

Antes de desplegar, crea tu entorno a partir de [.env.example](.env.example) y configura las variables sensibles directamente en el servidor.

Para health checks del hosting u orquestador usa:

```bash
GET /health
```

La respuesta devuelve estado general y salud de MongoDB. Si MongoDB no está conectado, responde `503`.

## Docker

La imagen de producción se construye con el [Dockerfile](Dockerfile) multi-stage incluido en el repositorio.

```bash
docker build -t backendbillarenlinea .
docker run --env-file .env -p 3000:3000 backendbillarenlinea
```

La imagen expone el puerto `3000` y usa `GET /health` como `HEALTHCHECK` interno.

## CI

El repositorio ahora incluye una acción en [.github/workflows/ci.yml](.github/workflows/ci.yml) que instala dependencias y ejecuta `npm run build` en cada `push` a `main` o `master` y en cada `pull request`.

Archivos y carpetas que normalmente si se suben al servidor:

- dist/
- package.json
- package-lock.json

Archivos y carpetas que no se deben subir:

- .env
- node_modules/
- logs temporales
- docs/ y scripts/ si no se usan en el servidor

Las variables de entorno deben configurarse directamente en el hosting o servidor.
