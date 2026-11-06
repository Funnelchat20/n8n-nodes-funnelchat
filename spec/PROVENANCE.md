# Where the specification comes from

The node is generated from these files with `npm run generate`. They are not edited by hand: they are replaced by a
new snapshot and generated again (see "Regenerating" in the README).

The portal's specification and the event catalog are in Spanish and are copied as they are (the generator checks
their SHA-256). The texts the node shows are in English: the name and purpose of each operation of the specification
come from `scripts/operations.en.json`, the labels of the events from `scripts/events.en.json`, and the labels of the
fields from `scripts/generator.config.json`. The supplements are written in English.

## `funnelchat.json` — the portal's full unified specification

| Item | Value |
|---|---|
| What it is | Full unified OpenAPI 3.1 specification of the public API (266 operations), behind `https://api.funnelchat.com`. Not the published one: `/specs/funnelchat.json` on the portal carries only the operations it shows. Never generate from that one |
| Repository | `developers-portal` (Funnelchat20) |
| Commit | `feat/plantillas-de-meta` @ `51c0aeb` (`v0.6.7`, not published on 2026-11-06) |
| File | `generated/specs/funnelchat-completa.json`, built by the portal's `npm run build`; handed over by the coordination session on 2026-11-06 (this repository did not fetch the portal) |
| Domain snapshots | accounts `v1.5.97` (`558332bcf`), conversations with `v1.19.37` (in production since 2026-11-06: bringing a number's templates from Meta, PR #2936), communities `feat/grupos-sin-panel` @ `54643bbd` (the application code of `v2.35.7`, in production since 2026-11-05, taken with the group actions on); see `x-fc-sources` in the file itself |
| SHA-256 | `38ae497ab7e6089b31b589e1f93c2289524348d581796eba109568885642813c` |
| Copied | 2026-11-06 |

It replaces the copy of 2026-11-05 (`main` @ `99928866`, `v0.6.3`, 265 operations, SHA-256 `0ffaad2b…`), and that one
the copy of 2026-11-05 (`main` @ `f5464516`, `v0.6.2`, 264 operations, SHA-256 `8228ea73…`). Before them:
2026-11-04 (`main` @ `c90565e4`, `v0.6.0`, 248 operations, SHA-256 `0f451fea…`) and 2026-10-15
(`feat/openapi-unificada` @ `0ef4abb`, 230 operations, SHA-256 `8bbbae56…`). With the copy of 2026-11-05 came sending
by phone without a contact (conversations `v1.19.21`, below) and the 16 public group actions of communities, so the
`communities-v2.35.5` supplement was removed (see "Removed"). With the copy of `99928866` came following a group
(communities `v2.35.7`, below). With this one comes bringing a number's templates from Meta
(`POST /api/v1/devices/{device}/templates`, `messageTemplate.sync`, conversations `v1.19.37`): "Bring templates from Meta"
in the node. What it **still does not have** is
covered by the supplements below:

- the 18 WhatsApp form routes (`/api/v1/forms…`): open to API keys in conversations `v1.19.21` and routed by api-edge in
  production, but the portal leaves them out (`x-fc-excluded-routes`, `edge_domain: null`) because its edge table
  (`config/borde.json`) is a copy of api-edge `4b3c1754a` (13-10), from before forms were routed;
- the poll and the event invitation (`interactiveMessage.storePoll`, `.storeEvent`): still not open to API keys, so
  the specification leaves them out; the node had them and keeps them.

**One operationId changed.** "Get a message" (`GET /api/v1/contacts/{contact}/messages/{message}`) is
`message.showMessage` in this specification; the node published it as `showMessage` (from the conversations
supplement). `keepOperationValues` in `scripts/generator.config.json` keeps `showMessage` as its value in n8n, so saved
workflows keep finding it. Every other operation the node had keeps its `operationId` and route.

**Sending by phone (conversations `v1.19.21`, in production since 2026-11-05).** In "Send a message"
(`POST /api/v1/message/send-message`) and "Send a template", `contact_id` is optional when `phone` comes: a phone that
is not a contact yet is created in the key's workspace, as `POST /contacts/update-or-create` does and with what it
needs (`conversations:write`, which includes send; without it, `403`), and the answer carries `message.contact_id`.
Sending to a contact that already exists in the key's workspace only needs `conversations:send`. `whatsapp_id` (Meta's BSUID) works instead of `phone` only
with an official number (`422` with a QR number). A phone of a contact of another workspace answers `404`; `phone` and
`contact_id` together have to be the same contact (`422 recipient_mismatch`). In the node, **Phone** is a field of its
own and the first one after the number, and **Contact ID** stays a field of its own, no longer required
(`topLevelFields` in the config), so a saved workflow that passes a contact keeps working.

**Following a group (communities `v2.35.7`, in production since 2026-11-05).** New `POST /api/v1/groups/{group}/import`
with `device_id` (`v2.apiGroupImport`, "Follow a group" in the node): imports one WhatsApp group of a QR number; the
number's admin status is read from WhatsApp. `201` imported, `200` already in the account, with
`{uid, name, imported, is_admin}`. It needs `communities:operate` (`403 import_permission_required`); 5 per number per
minute (`429 import_rate_limited`, `Retry-After`); an official number answers `422 provider_unsupported`; two at once,
`409 import_in_progress`. From then on the group sends `group_participant.joined` and `.left`. "Send a message to a
group" to a group not in the account imports it first, with the same rules (operate besides send;
`422 device_not_group_admin` if the number is not an admin, `422 device_not_connected` if disconnected). "List the
groups a number manages" (`GET /devices/{device}/groups`, live from WhatsApp) is cached one minute for a key.

**Production**, the versions every supplement and the catalog were checked against: accounts `v1.5.97` @ `558332bcf`,
conversations `v1.19.7` @ `4e35ddb83` (`v1.19.21` @ `f2937a71` on 2026-11-05: the forms and the absence of poll and
event did not change), communities `v2.35.5` @ `2be913d45`, platform-gate `v0.9.1` @
`cc2cee4b2` and api-edge `main` @ `975d815` (deployed to production on 2026-10-25; its latest tag, `v0.3.0` @
`a1c5b35`, is older and does not route `/api/v1/connect-links`). All of them read with `git show <commit>:<file>`,
never from a working tree.

**Every event carries `data.workspace_id`.** Since accounts `v1.5.97` (decision Q35 of 2026-11-04, platform-gate
`v0.9.1` lets it through), accounts writes in `data.workspace_id` the workspace the event is routed to, which is the
workspace of every subscription that receives it (`back/app/Modules/Webhook/Services/EventWorkspaceRouting.php`,
`stamp()`). An API key only sees and operates its own workspace, and so does the subscription it creates.

## What the config keeps on top of the specification

`scripts/generator.config.json` carries what saved workflows need and the specification cannot say. Each item was
checked against the production tags above.

- **`keepOperationValues`:** `message.showMessage` → `showMessage` (see above).
- **`topLevelFields`:** optional fields shown as fields of their own: **Phone** and **Contact ID** of "Send a message"
  and "Send a template" (see "Sending by phone").
- **`defaultOperation`** of each resource: the operation a saved workflow runs if it never changed it. Pinned because
  new operations of the specification could otherwise become the default (for example "Get a group action" in
  Groups).
- **`keepFieldKinds`:** the node published `events` of "Create" and "Update a webhook subscription" as text separated
  by commas. The specification now gives them as a list of the catalog's types, which in n8n would be another kind of
  field. They stay as text, so the value a saved workflow has still fits. The same goes for `orderBy` and
  `orderByMethod` of "List the scheduled sends that include a group": they were free text and are now options.
- **`fieldDefaults`:** `type` of "Create a connect link" shows `qr` first, which makes it the default. The
  specification lists `meta` first, and `meta` answers `503 meta_connect_disabled` while the official sign-up by link
  is off.
- **`extraParameters`:** `event_type` and `event_id` of "List a subscription's deliveries". The code reads them
  (accounts `v1.5.97`, `WebhookSubscriptionDeliveryController::index`) and the specification does not list them.
- **`operationNotes` and `fieldDescriptionsByName`:** the notices and English field descriptions of the operations
  that came from the three removed supplements, as they were (sends with an API key, webhook subscriptions,
  connecting numbers). The specification describes those fields in Spanish or not at all. A field description of the
  specification that is in Spanish is not shown, and the generator warns about it.

## `supplements/conversations-forms.json` — WhatsApp forms

The 18 WhatsApp form routes (`whatsappForm.*`), unchanged from the conversations `v1.18.10` supplement where they were
written from the code on 2026-10-22. Sending a form (`whatsappFormSend.store`) now comes from the specification.

| Item | Value |
|---|---|
| Repository | `conversations` (Funnelchat20), read only |
| Commit | tag `v1.18.10` @ `a580a3d0020c98d9777c4f05437454c52af7ee55`; checked again against tag `v1.19.7` @ `4e35ddb835249d37576597cc9a965c3e16ccb6d2` (production on 2026-11-04). Bodies and responses did not change. A number of another workspace now answers `404`. On 2026-11-05, against `v1.19.21` @ `f2937a71`: the same 18 routes in `allowed`, and no change in the forms' code |
| Access of API keys | `back/config/platform-gate.php`: the 18 routes are in `allowed` (`conversations:read` the `GET`s, `conversations:write` the rest) |
| Edge routing | `api-edge` `main` @ `975d815` (production): `/api/v1/forms…` goes to conversations, since `a144b49` (2026-10-22) |
| Why it is still a supplement | The portal leaves the routes out (`x-fc-excluded-routes`, `edge_domain: null`): its `config/borde.json` copies api-edge `4b3c1754a` (2026-10-13), from before forms were routed |
| operationIds | In the Scramble form (`class.method`), **not checked** against a generated specification |

When the portal brings these routes, remove the supplement from the config. If it names them differently, add the
old values to `keepOperationValues`.

## `supplements/conversations-kept-2026-10-15.json` — poll and event invitation

`interactiveMessage.storePoll` and `interactiveMessage.storeEvent`, copied from the 15-10 copy of the specification
(SHA-256 `8bbbae56…`) with their references resolved and their English name and purpose. They are not open to API
keys in conversations `v1.19.7`: they are not in `back/config/platform-gate.php` at all, so a key gets
`403 route_not_available`, and the notice says so. The full specification leaves them out for that reason. The node
had them, and saved workflows may use them, so they stay.

## Removed

The full specification has every route of these supplements, so they were removed from the config and from
`spec/supplements/`. They stay in the git history.

On 2026-11-05:

- `communities-v2.35.5.json`: sending a message to a group (`apiGroupAction.sendMessage`) and reading the group action
  (`apiGroupAction.show`), written from communities `v2.35.5`. The specification has them with the same
  `operationId`s, together with the other 14 public group actions (create a group, participants, admins, name,
  description, photo, settings, invite link, join requests), which come into the Groups resource with it. Group
  actions are on in production (`API_GROUP_ACTIONS_ENABLED=true`, confirmed by the user on 2026-11-04). Their notices
  and field texts are now in the config.

On 2026-11-04:

- `accounts-webhook-subscriptions.json`: the unified webhook subscriptions (`/api/v1/webhooks`), from accounts
  `v1.4.24`. They were checked again against `v1.5.97`, and the bodies and responses had not changed. A subscription
  now belongs to the workspace of the key that created it: a key sees only its own workspace's subscriptions, the cap
  of 50 counts per workspace, and a subscription whose workspace was deleted is `disabled` (`workspace_deleted`).
  `events` takes only names from the catalog: `*` answers `422`. The rule "`*` does not include
  `message.status_changed`" belongs to conversations' own subscriptions (`WebhookEventTypeEnum::coveredByWildcard()`),
  which api-edge does not route. The trigger subscribes by name, and rejects `*` before calling the API.
- `conversations-v1.18.10.json`: sending with an API key, its `200` with the queued message, `client_reference`,
  `file_type` and `file_name`, getting a message, and the forms (the forms are now in `conversations-forms.json`).
  They were checked again against `v1.19.7`: the first use's bodies did not change.
- `accounts-v1.5.97.json`: connecting numbers by API (`deviceProvisioning.*`, `connectLink.*`, the
  `external_reference` filter of `device.index`). The full specification has the same `operationId`s, tags,
  permissions and `x-fc-destructive: false`.

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
