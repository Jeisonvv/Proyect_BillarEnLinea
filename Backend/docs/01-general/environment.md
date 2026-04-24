# Entorno y configuracion

## Archivo base

La referencia oficial del entorno es .env.example.

## Variables obligatorias para arrancar

- PORT
- NODE_ENV
- MONGODB_URI
- JWT_SECRET

## Variables de frontend y cookies

- ALLOWED_ORIGINS
- FRONTEND_URL
- AUTH_COOKIE_NAME
- AUTH_COOKIE_SAME_SITE
- AUTH_COOKIE_SECURE
- AUTH_COOKIE_DOMAIN

Ejemplo local:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/billar_en_linea
JWT_SECRET=un_secreto_largo_y_aleatorio
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
AUTH_COOKIE_NAME=auth_token
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_DOMAIN=
```

## Variables para bot

- BOT_API_KEY
- LEAD_SESSION_TTL_HOURS

## Variables para correo

- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE
- SMTP_USER
- SMTP_PASS
- MAIL_FROM
- PASSWORD_RESET_URL_BASE

## Variables para Wompi

- WOMPI_PUBLIC_KEY
- WOMPI_INTEGRITY_SECRET
- WOMPI_EVENTS_SECRET
- WOMPI_REDIRECT_URL
- WOMPI_RAFFLES_REDIRECT_URL
- WOMPI_TOURNAMENTS_REDIRECT_URL

## Variables adicionales

- RAFFLE_RESERVATION_MINUTES
- TRUST_PROXY si el backend corre detras de proxy reverso

## Recomendaciones para produccion

1. JWT_SECRET con al menos 64 caracteres.
2. AUTH_COOKIE_SECURE=true en HTTPS.
3. AUTH_COOKIE_SAME_SITE=none solo si frontend y backend viven en dominios distintos y ya usas HTTPS.
4. ALLOWED_ORIGINS solo con dominios reales permitidos.
5. Nunca subir .env al repositorio.