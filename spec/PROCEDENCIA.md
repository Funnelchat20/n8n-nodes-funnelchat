# De dónde sale la especificación

El nodo se genera a partir de estos archivos con `npm run generate`. No se editan a mano: se reemplazan por una
instantánea nueva y se vuelve a generar (ver «Cómo regenerar» en el README).

## `funnelchat.json` — especificación unificada del portal

| Dato | Valor |
|---|---|
| Qué es | Especificación OpenAPI 3.1 unificada de la API pública (191 rutas, 230 operaciones), detrás de `https://api.funnelchat.com` |
| Repo | `developers-portal` (Funnelchat20) |
| Rama | `feat/openapi-unificada` @ `0ef4abb008870ed8c7cae49a08900a81e5e57ed8` (PR developers-portal #11, **sin mergear**) |
| Archivo | `out/specs/funnelchat.json`, salida del build del portal (idéntico a `public/specs/funnelchat.json`) |
| Armado | 2026-10-15 11:11 (-03:00), worktree limpio |
| Instantáneas de los dominios | conversations `9d723d52c`, communities `fab0bb10`, accounts `c234b6f8` (2026-10-13 10:41 -03:00); ver `x-fc-sources` en el propio archivo |
| SHA-256 | `8bbbae569b4cab520884db98f28204156c1bd6c629578bee609343c193e0dadb` |
| Copiado | 2026-10-16 |

Lo que esta instantánea **todavía no trae** (15-10 a la mañana):

- el envío de mensajes con clave (conversations PR #2284, sin mergear): las rutas de envío figuran con la nota del
  portal `send_pending` y hoy responden `403 route_not_available` a cualquier clave;
- `message.status_changed` como evento activo;
- las suscripciones de webhooks unificadas de accounts (`/api/v1/webhooks`), que vienen en el suplemento de abajo.

## `suplementos/accounts-webhook-subscriptions.json` — suscripciones de webhooks de accounts

Fragmento OpenAPI escrito a mano a partir del código, porque esas rutas no están en la instantánea. El generador lo
suma a la especificación **solo si la ruta no está ya en `funnelchat.json`**: cuando el portal tome una instantánea
que las incluya, el suplemento se ignora solo y el generador lo avisa.

| Dato | Valor |
|---|---|
| Repo | `accounts` (Funnelchat20), solo lectura |
| Commit | tag `v1.4.24` @ `300cc8435e6fa17e2ac274b88289a2cc7b945fcd` (2026-10-22 08:31 -03:00), el que corre en production. Escrito el 16-10 contra `origin/main` @ `c34cba2c0`; el 22-10 se revisó el diff hasta `v1.4.24`: los cuerpos y las respuestas no cambiaron, cambiaron el acceso de las claves y la regla de áreas |
| Rutas | `back/routes/api/webhooks.php` (bloque «Suscripciones de webhook UNIFICADAS») |
| Controladores | `back/app/Modules/Webhook/Http/Controllers/WebhookSubscriptionController.php`, `WebhookSubscriptionDeliveryController.php`, `WebhookSubscriptionTestController.php`, `WebhookEventCatalogController.php` |
| Cuerpos y respuestas | `Http/Requests/StoreWebhookSubscriptionRequest.php`, `UpdateWebhookSubscriptionRequest.php`, `Http/Resources/WebhookSubscriptionResource.php`, `WebhookSubscriptionCreatedResource.php`, `WebhookSubscriptionDeliveryResource.php`, `Services/SubscriptionFilter.php` |
| Catálogo de eventos | `back/app/Modules/Webhook/Catalogs/WebhookEventCatalog.php` y `Catalogs/Areas/*.php` |
| Ruteo del borde | `api-edge` tag `v0.3.0` @ `a1c5b35` (`src/routes.ts`): `/api/v1/webhooks…` va a accounts |
| Portal | `developers-portal` `feat/armar-funnelchat-portal` @ `dd7cd42` (`content/webhooks.md`): sobre, cabeceras, firma y reintentos |

**Estado para las claves de API (accounts `v1.4.24`):** abiertas. Están en la lista `allowed` de
`back/config/platform-gate.php`, salvo `POST /api/v1/webhooks/{id}/rotate-secret` y `/activate` (solo el panel). Por
`permission_prefix` piden `webhooks:read` (los `GET`) y `webhooks:write` (el resto), no `accounts:*`. Además, cada acción
exige que la clave sea del titular de la cuenta y el permiso de lectura del área de cada tipo de evento
(`Http/Controllers/Concerns/RejectsUnreadableAreas.php` y `StoreWebhookSubscriptionRequest::after`): sin él, el alta o el
cambio de eventos responde `422` en `events`, y ver, cambiar, borrar o probar responde `403 permission_denied`.
`GET /api/v1/webhooks/events` sigue pidiendo `accounts:read`.

## `eventos-webhooks.json` — catálogo de eventos de los webhooks

La lista de eventos que el disparador muestra cuando no puede leer el catálogo en vivo (`GET /api/v1/webhooks/events`
pide `accounts:read`). Tiene la forma de esa respuesta (`{data: [...], meta}`), así que una copia nueva del catálogo
(por ejemplo `snapshots/accounts/events.json` del portal) lo reemplaza tal cual. El generador la convierte en
`nodes/FunnelchatTrigger/generated/events.ts` (sin los tipos que no se pueden suscribir, como `webhook.test`).

| Dato | Valor |
|---|---|
| Repo | `accounts` (Funnelchat20), solo lectura |
| Commit | tag `v1.4.24` @ `300cc8435e6fa17e2ac274b88289a2cc7b945fcd` (2026-10-22 08:31 -03:00), el que corre en production |
| Archivos | `back/app/Modules/Webhook/Catalogs/Areas/AccountsEvents.php`, `ConversationsEvents.php`, `CommunitiesEvents.php` y `Catalogs/WebhookEventCatalog.php` (forma publicada: `type`, `area`, `status`, `is_critical`, `label`, `description`, `subscribable`) |
| Cómo | Extraído del código con un script (no de una llamada a la API): 54 tipos, 49 `active`, `webhook.test` no suscribible |
| SHA-256 | `c3da43bf6e9368e562249e3ee82450a15b8f974b6dd36b476aecd57c8ebfa7e4` |
| Copiado | 2026-10-22 |

## Firma de los webhooks

El algoritmo de `nodes/shared/signature.ts` y los vectores de `test/fixtures/firmas.json` salen de
`developers-portal` `feat/armar-funnelchat-portal` @ `dd7cd42`: `snippets/verificar-firma.js` (y sus pares en PHP y
Python) y `tests/test_firmas.py`. Coinciden con `Signature` de `platform-gate` (`t=<unix>,v1=<hex>`, tolerancia de
300 s), que es lo que firma accounts.
