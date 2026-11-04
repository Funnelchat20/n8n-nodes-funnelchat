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

It was the one the portal published on 2026-10-22 (`https://developers-portal.funnelchat.app/specs/funnelchat.json`,
same SHA-256). On 2026-11-04 the portal publishes a newer one (SHA-256
`5e55d0b43c7c5ca24795b9962c0fea47f8cf6d2b259aa5d5986311d1c9af0cb2`, 243 operations, from the domain snapshots of
22-10 and 26-10): it is not copied here, because the portal is rebuilding it around the first use and the node will be
regenerated from that one (phase 2). What this copy **does not have yet**, covered by the supplements and the catalog
below:

- sending with an API key open (the routes carry the `send_pending` note, "on its way"), its `200` response with the
  message, `client_reference`, `file_type` and `file_name`, reading a message, and the WhatsApp forms (conversations
  `v1.18.10`, still valid for `v1.19.7`);
- the unified webhook subscriptions of accounts (`/api/v1/webhooks`) and their access with an API key (accounts
  `v1.4.24`);
- connecting numbers by API: a number by QR, its QR code, the connect links and the numbers list by reference
  (accounts `v1.5.97`);
- sending a message to a group and reading the group action (communities `v2.35.5`);
- the current event catalog (`message.status_changed`, `whatsapp_form.completed`, the group events, the new
  `device.*`), copied from accounts `v1.5.97`.

**Production on 2026-11-04**, the versions every supplement and the catalog were checked against: accounts `v1.5.97`
@ `558332bcf`, conversations `v1.19.7` @ `4e35ddb83`, communities `v2.35.5` @ `2be913d45`, platform-gate `v0.9.1` @
`cc2cee4b2` and api-edge `main` @ `975d815` (deployed to production on 2026-10-25; its latest tag, `v0.3.0` @
`a1c5b35`, is older and does not route `/api/v1/connect-links`). All of them read with `git show <commit>:<file>`,
never from a working tree.

**Every event carries `data.workspace_id`.** Since accounts `v1.5.97` (decision Q35 of 2026-11-04, platform-gate
`v0.9.1` lets it through), accounts writes in `data.workspace_id` the workspace the event is routed to, which is the
workspace of every subscription that receives it (`back/app/Modules/Webhook/Services/EventWorkspaceRouting.php`,
`stamp()`). An API key only sees and operates its own workspace, and so does the subscription it creates.

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

**Checked again on 2026-11-04 against accounts `v1.5.97`:** bodies and responses did not change. The subscriptions
are now of a workspace: a key sees and changes only the ones of its workspace, the cap of 50 counts per workspace, and
a subscription whose workspace was deleted is `disabled` (`disabled_reason: workspace_deleted`). `events` takes only
names of the catalog: `*` is not one and answers `422` (`events.*.in`). The rule "`*` does not include
`message.status_changed`" is of the subscriptions of conversations (`WebhookEventTypeEnum::coveredByWildcard()`), which
api-edge does not route (`/api/v1/webhooks…` goes to accounts); the trigger subscribes by name anyway, and rejects `*`
before calling the API.

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

**Checked again on 2026-11-04 against conversations `v1.19.7` @ `4e35ddb83`** (the diff from `v1.18.10` of
`platform-gate.php`, the send requests, `MessageTemplateController.php`, `StoreContactRequest.php` and
`ShowMessageController.php`): the bodies of the first use (create a contact, send a text, send a template, get a
message) did not change. What changed: a key now works only inside its workspace (a number or contact of another one
answers `404`), sends accept `mentions` (for internal notes), and three routes opened to keys that the node does not
offer yet (`GET templates/{template}/metrics`, `POST contacts/{contact}/messages/{message}/read` and
`POST contacts/{contact}/typing`): they come with the portal's next specification.

## `supplements/accounts-v1.5.97.json` — connecting numbers by API

The first step of the first use: connect a number. Written by hand from the code of the tag running in production.
It **adds** six routes and **replaces** one (`"replaces": true`):

- `POST /api/v1/devices` (`deviceProvisioning.store`): a number that connects by QR (`connection: "qr"`, the only
  value), with `alias`, `external_reference`, `same_number_as` and `country`;
- `GET /api/v1/devices/{device}/qr` (`deviceProvisioning.qr`): its QR, a PNG as a data URI, renewed every 5 seconds;
- `POST`, `GET` (list) and `GET`/`DELETE /api/v1/connect-links/{link}` (`connectLink.store`, `.index`, `.show`,
  `.destroy`): single-use links for a customer to connect a number from a Funnelchat page;
- `GET /api/v1/devices` (`device.index`, replaced with the same `operationId`): the same list, with the
  `external_reference` filter.

| Item | Value |
|---|---|
| Repository | `accounts` (Funnelchat20), read only |
| Commit | tag `v1.5.97` @ `558332bcf1ffdb8e064fd3a1f7fafc67c4f95e8d`, the one running in production on 2026-11-04 |
| Access of API keys | `back/config/platform-gate.php`: all in `allowed`; `POST devices`, `GET devices/{device}/qr`, `POST connect-links` and `DELETE connect-links/{link}` also in `operate` (`accounts:operate`: they give control of a WhatsApp number, they are not irreversible, so they carry `x-fc-destructive: false` and no "irreversible" notice); the other `GET`s, `accounts:read` |
| Routes | `back/routes/api/devices.php` (block "alta-de-numeros-api") and `back/routes/api/connect-links.php` |
| Bodies and responses | `Device/Http/Requests/StoreDeviceRequest.php`, `StoreConnectLinkRequest.php`; `Http/Controllers/DeviceProvisioningController.php`, `ConnectLinkController.php`, `DeviceController.php` (`index`); `Http/Resources/DeviceResource.php`, `ConnectLinkResource.php`; `User/Services/PublicApiListings.php` (`perPage`, 25 by default, up to 100) |
| Edge routing | `api-edge` `main` @ `975d815` (PR #10, deployed to production on 2026-10-25): `/api/v1/connect-links` goes to accounts |
| Cross-check | The `operationId`s, tags, permissions, `x-fc-destructive` and query parameters are the same as in the unified specification the portal publishes on 2026-11-04 (SHA-256 `5e55d0b4…`) and in its accounts snapshot (`snapshots/accounts/openapi.json`, accounts `4e11bbb6a`, 2026-10-26) |
| Written | 2026-11-04 |

Not covered here: the official sign-up by link (`type: "meta"`) answers `503 meta_connect_disabled` while it is not
enabled, and the account's plan and payment decide whether a number can be created (`403 numbers_not_included`,
`number_limit_reached`); both are in the operations' notices.

When the portal publishes a specification that has these routes, remove the supplement from the config: with
`"replaces": true` it would keep winning over the specification.

## `supplements/communities-v2.35.5.json` — a message to a group

The group step of the first use: send a message to a group, and read how it went.

- `POST /api/v1/groups/{group}/messages` (`apiGroupAction.sendMessage`, `communities:send`): a text or one media file,
  sent now from one of the account's numbers. It answers `202 {action_id, status: "queued"}`.
- `GET /api/v1/groups/actions/{action}` (`apiGroupAction.show`, `communities:read`): the status and result of a group
  action; for a message, `result.message.uid` is its ID in WhatsApp. The outcome also arrives in the
  `group_action.completed` and `group_action.failed` events.

Those `operationId`s follow the Scramble form (`class.method`, the controller is `ApiGroupActionController`) and are
**not checked** against a generated specification: the portal's published one (2026-11-04) does not have the group
actions yet. The tag, `Acciones de grupo`, is the one communities documents them under (`ApiDocsGroup::GroupActions`),
so that the config maps them to the Groups resource without changes when the specification brings them.

| Item | Value |
|---|---|
| Repository | `communities` (Funnelchat20), read only |
| Commit | tag `v2.35.5` @ `2be913d45b123466cc9aa26a73343e9d2b1c68b1`, the one running in production on 2026-11-04 (`v2.35.4` fixed `GET /groups/{group}/messages`, which the node already had) |
| Access of API keys | `back/app/Modules/Shared/Catalog/ApiRouteCatalog.php`: `POST groups/{group}/messages` is `Send`, `GET groups/actions/{action}` is `Read`. Both are behind the kill switch `API_GROUP_ACTIONS_ENABLED` (`Shared/Support/ApiGroupActionsSwitch.php`, off by default): while it is off, every caller gets `403 route_not_available`. Whether it is on in production is an environment value the code does not show |
| Routes | `back/app/Modules/GroupManagement/routes.php` (block "Public group actions") |
| Bodies and responses | `GroupManagement/Requests/ApiGroupActions/SendGroupMessageRequest.php`, `Controllers/Api/V2/ApiGroupActionController.php`, `Resources/ApiGroupActionAcceptedResource.php`, `ApiGroupActionResource.php`, `Services/ApiGroupActions/ApiGroupActionTargetResolver.php` |
| Edge routing | `api-edge` `main` @ `975d815`: `/api/v1/groups…` goes to communities |
| Written | 2026-11-04 |

## `webhook-events.json` — the webhook event catalog

The event list the trigger shows when it cannot read the live catalog (`GET /api/v1/webhooks/events` needs
`accounts:read`). It has the shape of that response (`{data: [...], meta}`), so a new copy of the catalog (for example
`snapshots/accounts/events.json` of the portal) replaces it as is. The generator turns it into
`nodes/FunnelchatTrigger/generated/events.ts` (without the types that cannot be subscribed to, such as
`webhook.test`), with the English labels of `scripts/events.en.json`.

| Item | Value |
|---|---|
| Repository | `accounts` (Funnelchat20), read only |
| Commit | tag `v1.5.97` @ `558332bcf1ffdb8e064fd3a1f7fafc67c4f95e8d`, the one running in production on 2026-11-04 |
| Files | `back/app/Modules/Webhook/Catalogs/Areas/AccountsEvents.php`, `ConversationsEvents.php`, `CommunitiesEvents.php` and `Catalogs/WebhookEventCatalog.php` (published shape: `type`, `area`, `status`, `is_critical`, `label`, `description`, `subscribable`) |
| How | Extracted from the code with a script (not from an API call), the same one that, run on `v1.4.24`, gives back the previous copy byte for byte (SHA-256 `c3da43bf…`, 2026-10-22): 59 types, 54 `active`, `webhook.test` not subscribable. Against `v1.4.24` only the accounts area changed: five new `device.*` types (`deleted`, `health_changed`, `quality_changed`, `messaging_limit_changed`, `display_name_reviewed`) and the descriptions of `device.connected`, `device.disconnected` and `mac.usage_*` |
| SHA-256 | `6ceb64fea0d6df4a30e04b4e11735558b39a57a0ef78f262d601b83268082121` |
| Copied | 2026-11-04 |

The six events of the first use are all `active`: `device.connected` and `device.disconnected` (area `accounts`),
`message.received` and `message.status_changed` (`conversations`), `group_participant.joined` and
`group_participant.left` (`communities`). Every one arrives with `data.workspace_id` (see above).

## Webhook signature

The algorithm of `nodes/shared/signature.ts` and the vectors of `test/fixtures/firmas.json` come from
`developers-portal` `feat/armar-funnelchat-portal` @ `dd7cd42`: `snippets/verificar-firma.js` (and its PHP and Python
counterparts) and `tests/test_firmas.py`. They match `Signature` of `platform-gate` (`t=<unix>,v1=<hex>`, 300 s
tolerance), which is what accounts signs with.
