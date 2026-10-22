# Where the specification comes from

The node is generated from these files with `npm run generate`. They are not edited by hand: they are replaced by a
new snapshot and generated again (see "Regenerating" in the README).

The portal's specification and the event catalog are in Spanish and are copied as they are (the generator checks
their SHA-256). The texts the node shows are in English: the name and purpose of each operation of the specification
come from `scripts/operations.en.json`, the labels of the events from `scripts/events.en.json`, and the labels of the
fields from `scripts/generator.config.json`. The supplements are written in English.

## `funnelchat.json` — the portal's unified specification

| Item | Value |
|---|---|
| What it is | Unified OpenAPI 3.1 specification of the public API (191 routes, 230 operations), behind `https://api.funnelchat.com` |
| Repository | `developers-portal` (Funnelchat20) |
| Branch | `feat/openapi-unificada` @ `0ef4abb008870ed8c7cae49a08900a81e5e57ed8` (developers-portal PR #11, **not merged** at the time) |
| File | `out/specs/funnelchat.json`, output of the portal's build (identical to `public/specs/funnelchat.json`) |
| Built | 2026-10-15 11:11 (-03:00), clean worktree |
| Domain snapshots | conversations `9d723d52c`, communities `fab0bb10`, accounts `c234b6f8` (2026-10-13 10:41 -03:00); see `x-fc-sources` in the file itself |
| SHA-256 | `8bbbae569b4cab520884db98f28204156c1bd6c629578bee609343c193e0dadb` |
| Copied | 2026-10-16 |

It is also the one the portal publishes today (`https://developers-portal.funnelchat.app/specs/funnelchat.json`, same
SHA-256, checked on 2026-10-22). What it **does not have yet**, covered by the supplements and the catalog below:

- sending with an API key open (the routes carry the `send_pending` note, "on its way"), its `200` response with the
  message, `client_reference`, `file_type` and `file_name`, reading a message, and the WhatsApp forms (conversations
  `v1.18.10`);
- the unified webhook subscriptions of accounts (`/api/v1/webhooks`) and their access with an API key (accounts
  `v1.4.24`);
- the current event catalog (`message.status_changed`, `whatsapp_form.completed`, the group events).

## `supplements/accounts-webhook-subscriptions.json` — webhook subscriptions of accounts

An OpenAPI fragment written by hand from the code, because those routes are not in the snapshot. The generator adds
it to the specification **only if the route is not already in `funnelchat.json`**: when the portal takes a snapshot
that includes them, the supplement is ignored on its own and the generator says so.

| Item | Value |
|---|---|
| Repository | `accounts` (Funnelchat20), read only |
| Commit | tag `v1.4.24` @ `300cc8435e6fa17e2ac274b88289a2cc7b945fcd` (2026-10-22 08:31 -03:00), the one running in production. Written on 16-10 against `origin/main` @ `c34cba2c0`; on 22-10 the diff up to `v1.4.24` was reviewed: bodies and responses did not change, the access of API keys and the area rule did |
| Routes | `back/routes/api/webhooks.php` (block "Suscripciones de webhook UNIFICADAS") |
| Controllers | `back/app/Modules/Webhook/Http/Controllers/WebhookSubscriptionController.php`, `WebhookSubscriptionDeliveryController.php`, `WebhookSubscriptionTestController.php`, `WebhookEventCatalogController.php` |
| Bodies and responses | `Http/Requests/StoreWebhookSubscriptionRequest.php`, `UpdateWebhookSubscriptionRequest.php`, `Http/Resources/WebhookSubscriptionResource.php`, `WebhookSubscriptionCreatedResource.php`, `WebhookSubscriptionDeliveryResource.php`, `Services/SubscriptionFilter.php` |
| Event catalog | `back/app/Modules/Webhook/Catalogs/WebhookEventCatalog.php` and `Catalogs/Areas/*.php` |
| Edge routing | `api-edge` tag `v0.3.0` @ `a1c5b35` (`src/routes.ts`): `/api/v1/webhooks…` goes to accounts |
| Portal | `developers-portal` `feat/armar-funnelchat-portal` @ `dd7cd42` (`content/webhooks.md`): envelope, headers, signature and retries |

**Access for API keys (accounts `v1.4.24`):** open. They are in the `allowed` list of `back/config/platform-gate.php`,
except `POST /api/v1/webhooks/{id}/rotate-secret` and `/activate` (dashboard only). Through `permission_prefix` they
need `webhooks:read` (the `GET`s) and `webhooks:write` (the rest), not `accounts:*`. Each action also needs a key of
the account owner and the read permission of the area of each event type
(`Http/Controllers/Concerns/RejectsUnreadableAreas.php` and `StoreWebhookSubscriptionRequest::after`): without it,
creating or changing events answers `422` on `events`, and reading, changing, deleting or testing answers
`403 permission_denied`. `GET /api/v1/webhooks/events` still needs `accounts:read`.

## `supplements/conversations-v1.18.10.json` — sends with an API key, message by ID and forms

The portal's snapshot is from 13-10, before what conversations opened to API keys. This supplement brings, from the
code of the tag running in production:

- It **replaces** (`"replaces": true`) the five send operations the snapshot already had, with the same
  `operationId`, route and fields: `conversation.sendMessage`, `message.sendMessage`, `forwardMessage.store`,
  `contactCard.store` and `messageTemplate.send`. It adds `client_reference` to them (and `file_type` and `file_name`
  to the first two) and the `200` response with the queued message. The generator refuses a replacement that changes
  the `operationId`, and warns on every run which operations it replaces.
- It **adds** `GET /api/v1/contacts/{contact}/messages/{message}` (`showMessage`), the 18 WhatsApp form routes open to
  API keys (`whatsappForm.*`) and `POST /api/v1/contacts/{contact}/message/form` (`whatsappFormSend.store`). Those
  `operationId`s follow the Scramble form (`class.method`) but are **not checked** against a generated
  specification: if the portal's names them differently, when switching from the supplement to the specification,
  saved workflows that use those operations stop finding them.

| Item | Value |
|---|---|
| Repository | `conversations` (Funnelchat20), read only |
| Commit | tag `v1.18.10` @ `a580a3d0020c98d9777c4f05437454c52af7ee55` (2026-10-22 01:29 -05:00), the one running in production |
| Access of API keys | `back/config/platform-gate.php`: `send` and `allowed` lists (sends, `GET contacts/{contact}/messages/{message}`, forms). Poll and event (`message/poll`, `message/event`) are still outside: `403 route_not_available` |
| Bodies | `Message/Http/Requests/SendMessageRequest.php`, `SendDirectMessageRequest.php`, `ForwardMessageRequest.php`, `StoreContactCardRequest.php`, `MessageTemplateController.php`; `Message/Support/ClientReference.php` and `SendFileType.php`; `WhatsappForm/Http/Requests/*.php` |
| Responses | `Message/Http/Resources/PublicMessageResource.php`, `Message/Support/ApiKeySendResponse.php`, `ShowMessageController.php`, `WhatsappForm/Http/Controllers/WhatsappFormController.php` and `WhatsappFormSendController.php` |
| How | The five replaced operations were copied from `funnelchat.json` (with their references resolved) and the new parts were added; the rest were written by hand. With a one-off script, 2026-10-22 |

When the portal publishes a snapshot that has all of this, remove the supplement from the config and regenerate.

## `webhook-events.json` — the webhook event catalog

The event list the trigger shows when it cannot read the live catalog (`GET /api/v1/webhooks/events` needs
`accounts:read`). It has the shape of that response (`{data: [...], meta}`), so a new copy of the catalog (for example
`snapshots/accounts/events.json` of the portal) replaces it as is. The generator turns it into
`nodes/FunnelchatTrigger/generated/events.ts` (without the types that cannot be subscribed to, such as
`webhook.test`), with the English labels of `scripts/events.en.json`.

| Item | Value |
|---|---|
| Repository | `accounts` (Funnelchat20), read only |
| Commit | tag `v1.4.24` @ `300cc8435e6fa17e2ac274b88289a2cc7b945fcd` (2026-10-22 08:31 -03:00), the one running in production |
| Files | `back/app/Modules/Webhook/Catalogs/Areas/AccountsEvents.php`, `ConversationsEvents.php`, `CommunitiesEvents.php` and `Catalogs/WebhookEventCatalog.php` (published shape: `type`, `area`, `status`, `is_critical`, `label`, `description`, `subscribable`) |
| How | Extracted from the code with a script (not from an API call): 54 types, 49 `active`, `webhook.test` not subscribable |
| SHA-256 | `c3da43bf6e9368e562249e3ee82450a15b8f974b6dd36b476aecd57c8ebfa7e4` |
| Copied | 2026-10-22 |

## Webhook signature

The algorithm of `nodes/shared/signature.ts` and the vectors of `test/fixtures/firmas.json` come from
`developers-portal` `feat/armar-funnelchat-portal` @ `dd7cd42`: `snippets/verificar-firma.js` (and its PHP and Python
counterparts) and `tests/test_firmas.py`. They match `Signature` of `platform-gate` (`t=<unix>,v1=<hex>`, 300 s
tolerance), which is what accounts signs with.
