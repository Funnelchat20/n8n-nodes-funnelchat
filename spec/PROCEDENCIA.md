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
| Commit | `origin/main` @ `c34cba2c0c8f2274494731f99bbddd8d23321355` (2026-10-16 00:34 -03:00) |
| Rutas | `back/routes/api/webhooks.php` (bloque «Suscripciones de webhook UNIFICADAS») |
| Controladores | `back/app/Modules/Webhook/Http/Controllers/WebhookSubscriptionController.php`, `WebhookSubscriptionDeliveryController.php`, `WebhookSubscriptionTestController.php`, `WebhookEventCatalogController.php` |
| Cuerpos y respuestas | `Http/Requests/StoreWebhookSubscriptionRequest.php`, `UpdateWebhookSubscriptionRequest.php`, `Http/Resources/WebhookSubscriptionResource.php`, `WebhookSubscriptionCreatedResource.php`, `WebhookSubscriptionDeliveryResource.php`, `Services/SubscriptionFilter.php` |
| Catálogo de eventos | `back/app/Modules/Webhook/Catalogs/WebhookEventCatalog.php` y `Catalogs/Areas/*.php` |
| Ruteo del borde | `api-edge` `origin/main` @ `4b3c175` (`src/routes.ts`): `/api/v1/webhooks…` va a accounts |
| Portal | `developers-portal` `feat/armar-funnelchat-portal` @ `dd7cd42` (`content/webhooks.md`): sobre, cabeceras, firma y reintentos |

**Estado para las claves de API (accounts `origin/main` @ `c34cba2c0`):** estas rutas existen y las usa el panel,
pero no están en la lista `allowed` de `back/config/platform-gate.php`, así que hoy una clave recibe
`403 route_not_available`. Las que sí están habilitadas para claves son las de `/api/v1/webhooks/endpoints…` y
`GET /api/v1/webhooks/events` (incluidas en la especificación unificada). Además, cada acción exige que la clave sea
del titular de la cuenta.

## Firma de los webhooks

El algoritmo de `nodes/shared/signature.ts` y los vectores de `test/fixtures/firmas.json` salen de
`developers-portal` `feat/armar-funnelchat-portal` @ `dd7cd42`: `snippets/verificar-firma.js` (y sus pares en PHP y
Python) y `tests/test_firmas.py`. Coinciden con `Signature` de `platform-gate` (`t=<unix>,v1=<hex>`, tolerancia de
300 s), que es lo que firma accounts.
