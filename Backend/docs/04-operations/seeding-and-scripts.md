# Seeding y scripts

## Scripts disponibles

### Compilar

```bash
npm run build
```

### Levantar en desarrollo

```bash
npm run dev
```

### Ejecutar pruebas

```bash
npm test
```

### Seed de datos

```bash
npm run seed
```

### Verificar datos sembrados

```bash
npm run verify
```

### Limpiar base de datos

```bash
npm run db:clear -- --confirm=DELETE_ALL_DATA
```

## Advertencias

- db:clear elimina todos los documentos.
- Usa seeds y verify solo sobre ambientes controlados.
- Nunca corras limpieza masiva sobre produccion sin respaldo.

## Flujo sugerido para ambiente local

1. Configurar .env.
2. Ejecutar npm install.
3. Ejecutar npm run seed.
4. Ejecutar npm run verify.
5. Levantar con npm run dev.