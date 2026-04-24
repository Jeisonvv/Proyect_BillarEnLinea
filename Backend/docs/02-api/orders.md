# API Orders

Base path: /api/orders

## Resumen

Expone un MVP de pedidos de tienda con creacion de pedido, historial del usuario y gestion administrativa.

## Comportamiento actual

- El pedido guarda snapshot de nombre, variante y precio del producto al momento de comprar.
- El stock se valida y se descuenta al crear el pedido para productos simples o con variantes.
- Los pedidos creados para checkout web mantienen una reserva temporal de inventario.
- Si un pedido pasa a CANCELLED o REFUNDED y todavía retenía inventario, el stock se repone.
- El pago en Wompi se crea sobre un pedido ya existente y pendiente.

## Flujo de compra despues del carrito

1. El usuario llena su carrito en /api/cart.
2. El usuario ejecuta POST /api/cart/checkout.
3. El backend crea un pedido PENDING en /api/orders a partir de los items del carrito.
4. El pedido guarda snapshot de nombres, variante y precios al momento exacto de crear la compra.
5. El usuario puede consultar su pedido en GET /api/orders/me o GET /api/orders/:id.
6. Si quiere pagar en linea, usa POST /api/orders/:id/wompi/checkout.
7. Al crear el checkout, el backend garantiza o reactiva la reserva temporal de inventario del pedido.
8. Wompi procesa el pago y luego llama al webhook del backend.
9. Si el pago es aprobado dentro de la ventana activa, el pedido pasa a PAID automaticamente.
10. Si el pago falla, vence o da error, el pedido queda en PENDING pero el inventario reservado se libera.
11. Si el usuario quiere reintentar luego, el backend vuelve a reservar inventario solo si todavía hay stock.

Importante:

- El carrito no guarda la compra final.
- El pedido si guarda la compra final.
- El webhook de pagos trabaja contra el pedido ya creado.

## Endpoints privados de cliente autenticado

### POST /api/orders

Acceso: usuario autenticado

Payload recomendado:

```json
{
  "items": [
    {
      "productId": "6800abcd1234abcd1234abcd",
      "quantity": 1,
      "variantSku": "PRE-REVO-124"
    }
  ],
  "channel": "WEB",
  "paymentMethod": "TRANSFER",
  "paymentReference": "TRX-12345",
  "shippingAddress": "Calle 10 # 20-30, Cali",
  "notes": "Entregar en la tarde"
}
```

Notas:

- Si el producto tiene variantes, variantSku es obligatorio.
- Si el cliente intenta crear un pedido para otro usuario, el backend lo rechaza.

### GET /api/orders/me

Acceso: usuario autenticado

Devuelve el historial del usuario autenticado, mas reciente primero.

### GET /api/orders/:id

Acceso: usuario autenticado

Devuelve el detalle de un pedido propio. Admin o staff tambien pueden ver cualquier pedido.

### POST /api/orders/:id/wompi/checkout

Acceso: usuario autenticado

Crea o reutiliza una transaccion Wompi para un pedido pendiente.

Payload opcional:

```json
{
  "channel": "WEB"
}
```

Reglas:

- Un cliente solo puede pagar sus propios pedidos.
- Si ya existe una transaccion PENDING o APPROVED para el pedido, se reutiliza.
- Si el pedido ya fue cancelado o reembolsado, el checkout se rechaza.
- El checkout devuelve paymentExpiresAt cuando la reserva temporal aplica.
- Cuando Wompi aprueba el pago, el pedido pasa a PAID automaticamente.
- Si Wompi devuelve EXPIRED, DECLINED, VOIDED o ERROR, el pedido no expira ni se elimina: queda en PENDING y libera el inventario para que luego el usuario pueda reintentar si todavía hay stock.
- Si Wompi aprueba fuera del tiempo de reserva, el backend bloquea la aprobación tardía.

Respuesta esperada:

- data.paymentId: id interno de la transaccion.
- data.orderId: pedido relacionado.
- data.reference: referencia para Wompi.
- data.checkoutUrl o configuracion equivalente para abrir el widget o checkout.

## Endpoints administrativos

### GET /api/orders

Acceso: ADMIN, STAFF

Query soportada:

- status
- userId
- page
- limit

### PATCH /api/orders/:id/status

Acceso: ADMIN, STAFF

Payload:

```json
{
  "status": "PAID"
}
```

Estados soportados:

- PENDING
- PAID
- PROCESSING
- SHIPPED
- DELIVERED
- CANCELLED
- REFUNDED

Reglas importantes:

- Si el pedido pasa a CANCELLED o REFUNDED y aún retenía inventario, el stock se repone.
- Un pedido cancelado o reembolsado no se puede reabrir.