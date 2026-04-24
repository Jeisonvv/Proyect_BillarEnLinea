# API Products

Base path: /api/products

## Resumen

Expone el catalogo de productos de la tienda con listado publico y gestion administrativa.

## Endpoints publicos

### GET /api/products

Query soportada:

- category
- tag
- search
- page
- limit

Comportamiento:

- Solo lista productos con isActive=true.
- Permite filtrar por categoria.
- Permite buscar por texto en name y description.

### GET /api/products/:id

Devuelve el detalle de un producto por id.

## Endpoints administrativos

### GET /api/products/admin/all

Acceso: ADMIN, STAFF

Query soportada:

- category
- tag
- search
- isActive
- page
- limit

### POST /api/products

Acceso: ADMIN, STAFF

Payload minimo recomendado:

```json
{
  "name": "Taco Predator REVO",
  "category": "CUE",
  "basePrice": 850000,
  "stock": 2
}
```

Payload mas completo:

```json
{
  "name": "Taco Predator REVO",
  "description": "Taco profesional de alto rendimiento.",
  "category": "CUE",
  "basePrice": 850000,
  "stock": 0,
  "images": [
    "https://example.com/revo-1.jpg"
  ],
  "tags": ["importado", "premium"],
  "variants": [
    {
      "name": "12.4mm Shaft",
      "sku": "PRE-REVO-124",
      "price": 850000,
      "stock": 3
    }
  ]
}
```

### PATCH /api/products/:id

Acceso: ADMIN, STAFF

Actualiza cualquier campo del producto, incluyendo stock simple, variantes, tags o estado activo.

### DELETE /api/products/:id

Acceso: ADMIN, STAFF

No borra fisicamente el producto. Lo oculta del catalogo configurando isActive=false.