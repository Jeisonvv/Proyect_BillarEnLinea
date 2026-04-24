# API Posts

Base path: /api/posts

## Endpoints publicos

### GET /api/posts

Query:

- category
- tag
- search
- page
- limit

### GET /api/posts/:slug

## Endpoints administrativos

### GET /api/posts/admin/all

Acceso: ADMIN, STAFF

### GET /api/posts/id/:id

Acceso: ADMIN, STAFF

### POST /api/posts

Acceso: ADMIN, STAFF

Payload tipico:

```json
{
  "title": "Como elegir tu taco",
  "excerpt": "Guia corta para principiantes",
  "content": "Contenido del articulo...",
  "slug": "como-elegir-tu-taco",
  "status": "PUBLISHED",
  "tags": ["tacos", "guia"],
  "noIndex": false
}
```

### PUT /api/posts/:id

### DELETE /api/posts/:id