# API Cart

Base path: /api/cart

## Resumen

Expone el carrito del usuario autenticado para agregar articulos y luego convertirlos en un pedido.

## Comportamiento actual

- Cada usuario tiene un carrito propio.
- El carrito no reserva stock ni crea pago por si mismo.
- El precio del carrito es una estimacion basada en el precio actual del catalogo.
- El pedido real se crea cuando el usuario hace checkout del carrito.
- Al hacer checkout, el carrito se vacia y el stock se descuenta por la logica de orders.
- Si ese pedido entra a checkout web y luego el pago falla o vence, el pedido sigue existiendo pero la reserva temporal de inventario se libera.

## Flujo de compra

1. El usuario autenticado agrega productos al carrito con POST /api/cart/items.
2. El backend valida que el producto exista, este activo y tenga stock suficiente para la cantidad pedida.
3. El usuario puede consultar el carrito con GET /api/cart, cambiar cantidades con PATCH /api/cart/items o eliminar articulos con DELETE /api/cart/items.
4. Cuando el usuario confirma la compra, hace POST /api/cart/checkout.
5. El backend convierte los items del carrito en un pedido real usando la logica del modulo orders.
6. Si el pedido se crea correctamente, el carrito se vacia.
7. Desde ese momento la compra ya no vive en cart sino en orders.

Importante:

- El carrito es temporal.
- El pedido es el registro real de la compra.
- El pago Wompi se hace sobre el pedido, no sobre el carrito.

## Endpoints privados de cliente autenticado

### GET /api/cart

Devuelve el carrito actual del usuario autenticado.

### POST /api/cart/items

Agrega un articulo al carrito. Si el producto ya existe con la misma variante, suma cantidades.

Payload recomendado:

```json
{
  "productId": "6800abcd1234abcd1234abcd",
  "quantity": 1,
  "variantSku": "PRE-REVO-124"
}
```

### PATCH /api/cart/items

Actualiza la cantidad exacta de un articulo del carrito.

Si quantity=0, elimina ese articulo del carrito.

### DELETE /api/cart/items

Elimina un articulo puntual del carrito.

Payload recomendado:

```json
{
  "productId": "6800abcd1234abcd1234abcd",
  "variantSku": "PRE-REVO-124"
}
```

### DELETE /api/cart

Vacía todo el carrito del usuario autenticado.

### POST /api/cart/checkout

Convierte el contenido del carrito en un pedido real usando la logica del modulo orders.

Payload opcional:

```json
{
  "channel": "WEB",
  "paymentMethod": "TRANSFER",
  "paymentReference": "TRX-12345",
  "shippingAddress": "Calle 10 # 20-30, Cali",
  "notes": "Entregar en la tarde"
}
```

Reglas:

- Si el carrito esta vacio, el checkout se rechaza.
- Si un producto ya no existe, esta inactivo o no tiene stock suficiente al momento del checkout, el pedido no se crea.
- El carrito no reemplaza al pedido: solo es el paso previo.

Respuesta esperada:

- data.order: el pedido creado.
- data.cart: el carrito ya vacio despues de crear el pedido.