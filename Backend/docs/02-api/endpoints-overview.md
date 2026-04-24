# Mapa General de Endpoints

Snapshot actual de endpoints expuestos por el backend.

- Total identificado: 71 endpoints.
- Base URL local sugerida: http://localhost:3000
- Convencion general de respuesta: ok + data o ok + message.

## Modulos incluidos

- Auth
- Users
- Events
- Lead Sessions
- Matches
- Payments
- Cart
- Orders
- Products
- Posts
- Raffles
- Transmissions
- Tournaments

## Auth

Base path: /api/auth

- POST /api/auth/register: registra un usuario nuevo para acceso web.
- POST /api/auth/login: inicia sesion y, para cliente web, deja cookie de autenticacion.
- POST /api/auth/bot-login: login tecnico para integraciones del bot y retorno de token.
- POST /api/auth/forgot-password: inicia recuperacion de contrasena por correo.
- POST /api/auth/reset-password: cambia la contrasena usando un token de recuperacion.
- POST /api/auth/logout: cierra sesion y limpia la autenticacion vigente.

## Users

Base path: /api/users

- POST /api/users: crea un usuario desde administracion.
- GET /api/users: lista usuarios con filtros y paginacion.
- GET /api/users/by-phone/:phone: busca un usuario por telefono.
- GET /api/users/by-provider/:provider/:providerId: busca un usuario por proveedor externo e identificador externo.
- GET /api/users/:id/conversation-state: obtiene el estado conversacional de un usuario por canal.
- PUT /api/users/:id/conversation-state: actualiza el estado conversacional de un usuario.
- GET /api/users/:id: obtiene un usuario por id.
- PATCH /api/users/:id: actualiza datos de un usuario.
- DELETE /api/users/:id: elimina logicamente un usuario.

## Events

Base path: /api/events

- GET /api/events: lista eventos con filtros y paginacion.
- GET /api/events/:id: obtiene el detalle de un evento.
- POST /api/events: crea un evento.
- PUT /api/events/:id: actualiza un evento.
- DELETE /api/events/:id: elimina un evento.

## Lead Sessions

Base path: /api/lead-sessions

- POST /api/lead-sessions: crea o reutiliza una sesion temporal de lead.
- GET /api/lead-sessions/:channel/:providerId: consulta una sesion temporal por canal e id externo.
- PUT /api/lead-sessions/:channel/:providerId/state: actualiza el estado conversacional de la sesion.
- PATCH /api/lead-sessions/:channel/:providerId/data: actualiza los datos capturados del lead.
- POST /api/lead-sessions/:channel/:providerId/promote: promueve la sesion a un usuario persistente o flujo equivalente.

## Matches

Base path: /api/matches

- GET /api/matches/tournament/:id: lista los partidos de un torneo.
- GET /api/matches/:id: obtiene el detalle de un partido.
- POST /api/matches/:id/result: registra el resultado de un partido y avanza el torneo si aplica.

## Payments

Base path: /api/payments

- POST /api/payments/wompi/webhook: recibe eventos webhook de Wompi para procesar pagos.

## Orders

Base path: /api/orders

- POST /api/orders: crea un pedido de tienda para el usuario autenticado.
- GET /api/orders/me: lista el historial del usuario autenticado.
- GET /api/orders: lista pedidos para administracion.
- GET /api/orders/:id: obtiene el detalle de un pedido propio o administrativo.
- POST /api/orders/:id/wompi/checkout: crea o reutiliza checkout Wompi para un pedido.
- PATCH /api/orders/:id/status: actualiza el estado del pedido.

## Cart

Base path: /api/cart

- GET /api/cart: obtiene el carrito actual del usuario autenticado.
- POST /api/cart/items: agrega un producto al carrito.
- PATCH /api/cart/items: actualiza la cantidad de un producto del carrito.
- DELETE /api/cart/items: elimina un producto puntual del carrito.
- DELETE /api/cart: vacia el carrito.
- POST /api/cart/checkout: convierte el carrito en un pedido.

Flujo recomendado de tienda:

- Primero: /api/cart/*
- Luego: POST /api/cart/checkout
- Despues: POST /api/orders/:id/wompi/checkout
- Finalmente: POST /api/payments/wompi/webhook confirma el pago

## Products

Base path: /api/products

- GET /api/products: lista productos activos del catalogo con filtros y paginacion.
- GET /api/products/:id: obtiene el detalle de un producto.
- GET /api/products/admin/all: lista productos para administracion.
- POST /api/products: crea un producto.
- PATCH /api/products/:id: actualiza un producto.
- DELETE /api/products/:id: oculta un producto del catalogo.

## Posts

Base path: /api/posts

- GET /api/posts: lista posts publicos con filtros y paginacion.
- GET /api/posts/admin/all: lista todos los posts para administracion.
- GET /api/posts/id/:id: obtiene un post por id para administracion.
- GET /api/posts/:slug: obtiene un post publico por slug.
- POST /api/posts: crea un post.
- PUT /api/posts/:id: actualiza un post.
- DELETE /api/posts/:id: elimina un post.

## Raffles

Base path: /api/raffles

- POST /api/raffles: crea una rifa.
- GET /api/raffles: lista rifas con filtros y paginacion.
- GET /api/raffles/:id: obtiene el detalle de una rifa.
- GET /api/raffles/:id/numbers: lista los numeros de una rifa y su estado.
- GET /api/raffles/:id/number-owners: lista los propietarios de numeros de la rifa.
- GET /api/raffles/:id/available-numbers: devuelve los numeros disponibles para compra.
- POST /api/raffles/:id/tickets: compra o reserva boletas o numeros de la rifa.
- POST /api/raffles/:id/wompi/checkout: crea el checkout de pago Wompi para la rifa.
- POST /api/raffles/:id/draw: registra manualmente el numero ganador de la rifa, incluso si no fue vendido o estaba solo reservado.
- DELETE /api/raffles/:id: elimina una rifa.

## Transmissions

Base path: /api/transmissions

- GET /api/transmissions: lista solicitudes de transmision.
- GET /api/transmissions/:id: obtiene una solicitud de transmision por id.
- POST /api/transmissions: crea una solicitud de transmision.
- PUT /api/transmissions/:id: actualiza una solicitud de transmision.
- DELETE /api/transmissions/:id: elimina una solicitud de transmision.

## Tournaments

Base path: /api/tournaments

- POST /api/tournaments: crea un torneo.
- GET /api/tournaments: lista torneos con filtros y paginacion.
- GET /api/tournaments/:id: obtiene el detalle de un torneo.
- GET /api/tournaments/:id/registrations: lista las inscripciones de un torneo.
- POST /api/tournaments/:id/register-self: permite que el usuario autenticado se inscriba a si mismo.
- POST /api/tournaments/:id/register: inscribe manualmente a un jugador en el torneo.
- POST /api/tournaments/:id/wompi/checkout: crea el checkout de pago Wompi para inscripcion al torneo.
- PATCH /api/tournaments/:id/registrations/:userId/handicap: actualiza el handicap de un inscrito.
- GET /api/tournaments/:id/bracket: obtiene el bracket actual del torneo.
- GET /api/tournaments/:id/results: obtiene resultados consolidados del torneo.
- GET /api/tournaments/:id/pending-payments: lista pagos pendientes del torneo.
- POST /api/tournaments/:id/generate-bracket: genera el bracket del torneo.
- GET /api/tournaments/:id/group-standings: obtiene la tabla de posiciones por grupos.
- POST /api/tournaments/:id/groups: crea grupos manualmente.
- POST /api/tournaments/:id/add-groups: agrega nuevos grupos y confirma inscripciones relacionadas.
- POST /api/tournaments/:id/groups/:groupId/add-player: agrega un jugador a un grupo existente.
- POST /api/tournaments/:id/auto-groups: crea grupos automaticamente.
- GET /api/tournaments/:id/adjustment-round: obtiene la ronda de ajuste si existe.
- POST /api/tournaments/:id/generate-adjustment-round: genera la ronda de ajuste.
- POST /api/tournaments/:id/generate-bracket-from-groups: genera bracket usando resultados de grupos.
- POST /api/tournaments/:id/notify-groups: prepara notificaciones para grupos del torneo.

## Acceso por tipo

### Publicos

- Auth publico.
- GET publicos de events, matches, posts, raffles y tournaments.
- POST /api/payments/wompi/webhook.

### Privados web

- Administracion de users.
- Escritura administrativa de events, posts, raffles, transmissions y tournaments.
- Acciones autenticadas de checkout, compra o autoinscripcion.

### Privados bot

- GET /api/users/by-provider/:provider/:providerId.
- GET /api/users/:id/conversation-state.
- PUT /api/users/:id/conversation-state.
- Todo /api/lead-sessions/*.