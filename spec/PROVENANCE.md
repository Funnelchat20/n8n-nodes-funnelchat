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
| What it is | Full unified OpenAPI 3.1 specification of the public API (203 routes, 248 operations, 29 webhooks), behind `https://api.funnelchat.com`. Not the published one: `/specs/funnelchat.json` on the portal carries only the 23 operations it shows. Never generate from that one |
| Repository | `developers-portal` (Funnelchat20) |
| Commit | `main` @ `c90565e4f1aaaa8fe8ee6fb7fc24c4e8e274103d` (merge of PR #33, deployed as `v0.6.0` on 2026-11-04) |
| File | `generated/specs/funnelchat-completa.json`, built by the portal's `npm run build`; handed over by the coordination session on 2026-11-04 (this repository did not fetch the portal) |
| Domain snapshots | accounts `v1.5.97` (`558332bcf`), conversations `v1.19.7` (`4e35ddb83`), communities `v2.35.5` (`2be913d4`), the versions in production; see `x-fc-sources` in the file itself |
| SHA-256 | `0f451feaba59418f3a556f58856f841f12570973fd6525103e8cc0128ab64374` |
| Copied | 2026-11-04 |

It replaces the copy of 2026-10-15 (developers-portal `feat/openapi-unificada` @ `0ef4abb`, 230 operations, SHA-256
`8bbbae569b4cab520884db98f28204156c1bd6c629578bee609343c193e0dadb`), whose gaps the supplements of
`accounts-webhook-subscriptions`, `conversations-v1.18.10` and `accounts-v1.5.97` covered. This one has all of their
routes except the WhatsApp forms, so those three supplements were removed (see "Removed on 2026-11-04"). What it
**still does not have** is covered by the supplements below:

- the 18 WhatsApp form routes (`/api/v1/forms…`): open to API keys in conversations `v1.19.7` and routed by api-edge in
  production, but the portal leaves them out (`x-fc-excluded-routes`, `edge_domain: null`) because its edge table
  (`config/borde.json`) is a copy of api-edge `4b3c1754a` (13-10), from before forms were routed;
- sending a message to a group and reading the group action (communities `v2.35.5`): communities' snapshot was taken
  with the group actions off locally, so the two routes are not in it; in production they are on;
- the poll and the event invitation (`interactiveMessage.storePoll`, `.storeEvent`): still not open to API keys, so
  the specification leaves them out; the node had them and keeps them.

**One operationId changed.** "Get a message" (`GET /api/v1/contacts/{contact}/messages/{message}`) is
`message.showMessage` in this specification; the node published it as `showMessage` (from the conversations
supplement). `keepOperationValues` in `scripts/generator.config.json` keeps `showMessage` as its value in n8n, so saved
workflows keep finding it. Every other operation the node had keeps its `operationId` and route.

**Production on 2026-11-04**, the versions every supplement and the catalog were checked against: accounts `v1.5.97`
@ `558332bcf`, conversations `v1.19.7` @ `4e35ddb83`, communities `v2.35.5` @ `2be913d45`, platform-gate `v0.9.1` @
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
| Commit | tag `v1.18.10` @ `a580a3d0020c98d9777c4f05437454c52af7ee55`; checked again against tag `v1.19.7` @ `4e35ddb835249d37576597cc9a965c3e16ccb6d2` (production on 2026-11-04). Bodies and responses did not change. A number of another workspace now answers `404` |
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

## `supplements/communities-v2.35.5.json` — a message to a group

The group step of the first use: send a message to a group, and read how it went.

- `POST /api/v1/groups/{group}/messages` (`apiGroupAction.sendMessage`, `communities:send`): a text or one media file,
  sent now from one of the account's numbers. It answers `202 {action_id, status: "queued"}`.
- `GET /api/v1/groups/actions/{action}` (`apiGroupAction.show`, `communities:read`): the status and result of a group
  action; for a message, `result.message.uid` is its ID in WhatsApp. The outcome also arrives in the
  `group_action.completed` and `group_action.failed` events.

They are not in the full specification: communities' snapshot was taken with the group actions off locally. Those
`operationId`s follow the Scramble form (`class.method`, the controller is `ApiGroupActionController`) and are **not
checked** against a generated specification. The tag, `Acciones de grupo`, is the one communities documents them under
(`ApiDocsGroup::GroupActions`), so the config maps them to the Groups resource without changes when the specification
brings them.

| Item | Value |
|---|---|
| Repository | `communities` (Funnelchat20), read only |
| Commit | tag `v2.35.5` @ `2be913d45b123466cc9aa26a73343e9d2b1c68b1`, the one running in production on 2026-11-04 (`v2.35.4` fixed `GET /groups/{group}/messages`, which the node already had) |
| Access of API keys | `back/app/Modules/Shared/Catalog/ApiRouteCatalog.php`: `POST groups/{group}/messages` is `Send` (`communities:send`), `GET groups/actions/{action}` is `Read` (`communities:read`). They are part of the public group actions, which `API_GROUP_ACTIONS_ENABLED` turns on (`Shared/Support/ApiGroupActionsSwitch.php`): it is `true` in production (communities-api, confirmed by the user on 2026-11-04; the code does not show it) |
| Routes | `back/app/Modules/GroupManagement/routes.php` (block "Public group actions") |
| Bodies and responses | `GroupManagement/Requests/ApiGroupActions/SendGroupMessageRequest.php`, `Controllers/Api/V2/ApiGroupActionController.php`, `Resources/ApiGroupActionAcceptedResource.php`, `ApiGroupActionResource.php`, `Services/ApiGroupActions/ApiGroupActionTargetResolver.php` |
| Edge routing | `api-edge` `main` @ `975d815`: `/api/v1/groups…` goes to communities |
| Written | 2026-11-04 |

## Removed on 2026-11-04

The full specification has every route of these supplements, so they were removed from the config and from
`spec/supplements/`. They stay in the git history:

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
