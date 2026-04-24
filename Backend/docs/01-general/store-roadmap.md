# Store Roadmap

## Estado actual

Hoy el backend ya expone un primer MVP de tienda por API.

Ya existe base operativa:

- Modelo de productos en src/models/product.model.ts.
- Modelo de pedidos en src/models/order.model.ts.
- Modulo Nest de products con rutas /api/products.
- Modulo Nest de cart con rutas /api/cart.
- Modulo Nest de orders con rutas /api/orders.
- Servicios de negocio para catalogo, carrito, pedidos y stock para productos simples o con variantes.
- Documentacion API para tienda.
- Categorias de producto y estados de pedido en src/models/enums.ts.
- Datos de ejemplo para productos y pedidos en src/utils/seedData.ts.
- Checkout Wompi para pedidos y webhook centralizado de pagos.

Lo que no existe hoy:

- Flujo de postventa mas completo.
- Reserva temporal de inventario para pedidos en checkout.

## Que significa esto en negocio

La tienda ya quedo integrada en una primera version funcional del backend.

En este momento si hay:

- Catalogo publico consumible por frontend.
- Carrito autenticado para agregar articulos antes de comprar.
- CRUD administrativo de productos.
- Flujo cart -> order -> checkout Wompi -> webhook.
- Seguimiento administrativo de pedidos.
- Confirmacion automatica de pedidos pagados.

Todavia no hay:

- Reserva temporal de inventario mientras el usuario esta pagando.
- Flujo de postventa mas completo para despacho, soporte y devoluciones.

## Minimo viable para lanzar tienda

### 1. Catalogo de productos

Endpoints minimos recomendados:

- GET /api/products: listado publico con filtros por categoria, busqueda y paginacion.
- GET /api/products/:id o /api/products/:slug: detalle publico de producto.
- POST /api/products: crear producto, solo ADMIN o STAFF.
- PATCH /api/products/:id: editar producto, solo ADMIN o STAFF.
- DELETE /api/products/:id o PATCH para isActive=false: ocultar producto del catalogo.

Capacidades minimas:

- Filtrar por category.
- Buscar por texto usando name y description.
- Mostrar variantes, precio y stock.
- Soportar isActive para ocultar productos sin borrarlos.

### 2. Pedidos

Endpoints minimos recomendados:

- POST /api/orders: crear pedido desde productos seleccionados.
- GET /api/orders/me: historial del usuario autenticado.
- GET /api/orders/:id: detalle de pedido propio o administrativo.
- GET /api/orders: listado administrativo con filtros por status.
- PATCH /api/orders/:id/status: actualizar estado del pedido.

Capacidades ya implementadas:

- Tomar snapshot de nombre y precio al crear el pedido.
- Validar stock disponible al momento de comprar.
- Descontar stock al crear el pedido para productos simples o con variantes.
- Reponer stock cuando el pedido pasa a CANCELLED o REFUNDED.
- Guardar direccion de envio y notas.
- Mantener el pedido en PENDING si Wompi falla, vence o rechaza el pago.
- Liberar la reserva temporal de inventario si el checkout de Wompi vence, falla o es rechazado.

Pendiente en pedidos:

- Definir reserva temporal de inventario cuando exista checkout.
- Completar reglas de postventa.

### 3. Pagos de tienda

La infraestructura de pagos de pedidos ya reutiliza PaymentPayableType.ORDER y el webhook central de Wompi.

Ya implementado:

- POST /api/orders/:id/wompi/checkout.
- Reutilizar webhook de Wompi para confirmar pedidos.
- Pasar pedido de PENDING a PAID cuando llegue aprobacion.
- Mantener pedido PENDING cuando la transaccion no termina aprobada.

## Orden recomendado de implementacion

1. Reserva temporal de inventario durante checkout.
2. Panel administrativo de operacion mas completo.
3. Reglas de postventa y devoluciones.
4. Integracion de envios o retiro en tienda si aplica.

Estado del punto 1:

- Ya existe una reserva temporal de inventario para pedidos pendientes de checkout web.
- Ya existe limpieza automática por worker interno del backend, además del cleanup reactivo por endpoints.
- Si en el futuro separan procesos o escalan horizontalmente con más control, podría migrarse a un cron externo o cola dedicada.

## Riesgos a resolver antes de salir a produccion

- Definir si el stock se descuenta al reservar o solo al pagar.
- Definir si los pedidos aceptan envio, retiro en tienda o ambos.
- Definir politica de productos sin variantes vs con variantes.
- Definir si los productos tendran slug publico o solo _id.
- Definir flujo de cancelacion y devolucion.

## Recomendacion pragmatica

Si quieren lanzar rapido, el menor camino es:

1. Products publico + admin.
2. Cart y orders con checkout Wompi ya integrado.
3. Cerrar antes de produccion la politica de reserva temporal de stock y postventa.