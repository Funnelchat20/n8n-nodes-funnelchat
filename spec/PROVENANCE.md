# Where the specification comes from

The node is generated from `spec/funnelchat.json` with `npm run generate`. It is not edited by hand: a new one is
copied with `npm run generate -- --spec <file>`, which writes the block below and generates again (see "Regenerating"
in the README).

**Only what the portal publishes.** Since 0.3.0 (decided by the user on 2026-11-11) the node is generated from the
specification the developer portal publishes (`/specs/funnelchat.json`), and from nothing else: every operation and
every event type it shows, in its groups, and no route it leaves out. Before, the node came from the portal's full
specification and from supplements written from the domains' code, which also carried routes closed to API keys.

The specification is in Spanish and is copied as it is (the generator checks its SHA-256 against this file). The
texts the node shows are in English: the name and purpose of each operation come from `scripts/operations.en.json`,
the labels of the events from `scripts/events.en.json`, and the names of the resources and categories and the labels
of the fields from `scripts/generator.config.json`.

<!-- spec:start (written by npm run generate -- --spec) -->

## `funnelchat.json` — the portal's published specification

Written by `npm run generate -- --spec`, which copies the file byte for byte and generates from it (it does not
download it). The node carries every operation and event type of this file, and nothing else.

| Item | Value |
|---|---|
| What it is | The OpenAPI specification the developer portal publishes: the functions an API key can use, as the portal shows them |
| Published at | `https://developers-portal.funnelchat.app/specs/funnelchat.json` |
| `info` | Funnelchat API `v0` |
| Operations | 253, in 30 groups |
| Event types (`webhooks`) | 56 |
| Domains (`x-fc-sources`) | conversations (147 operations), communities (55 operations), accounts (51 operations) |
| Categories | Primer uso (`primer-uso`): 1 group, Funciones de WhatsApp (`whatsapp`): 9 groups, Funciones de Funnelchat (`funnelchat`): 20 groups |
| SHA-256 | `7db2ead826697c80fd8feef3f0ea556b5374dd3d2cb5e02f3cfe4584af79e33c` |
| Copied | 2026-11-13 |

<!-- spec:end -->

## The copy of 2026-11-13, third (portal `v0.6.16`)

The specification published at `https://developers-portal.funnelchat.app/specs/funnelchat.json`, portal `v0.6.16`,
SHA-256 `7db2ead826697c80fd8feef3f0ea556b5374dd3d2cb5e02f3cfe4584af79e33c`: 253 operations and 57 entries in
`webhooks`, as in `v0.6.15`.

- **Responses.** Deleting a template documents `204`, `401`, `402`, `403`, `404`, `422` (`number_not_connected_to_meta`,
  `meta_rejected`) and `502`; creating a group, `402`; the two sends of a message, `415`; a form's new version, `201`.
  The three operations of a number's username answer `502 provider_error`, and Meta's refusal with Meta's own HTTP
  status and `error` `meta_error`. `ApiGroupActionResource`, which "Get a group action" pointed to, is now in the
  specification, so the generator no longer takes that operation for a list without pagination (the node ran it the
  same way: one request, one item).
- **Texts.** The Spanish descriptions of 8 operations and 12 event types changed: a send the monthly active contacts
  stop leaves nothing in the contact's history; an empty description of an official number's group answers `422`;
  up to 50 webhook subscriptions per workspace (`422 webhooks_limit_reached`), and creating one takes no
  `Idempotency-Key`; `group_participant.joined` and `.left` go out at most once per person, group and UTC day;
  `group.blocked`, `group.recovered` and `pipeline.finished` are of campaign groups only; the dates of the number
  events' examples end in `Z`. The node's texts are its English ones, so nothing of that changes in it.
- **Nothing else.** No operation, parameter, group or event type came in, went out or changed; there was no warning
  nor text to review.

## The copy of 2026-11-13, second (portal `v0.6.15`)

The specification published at `https://developers-portal.funnelchat.app/specs/funnelchat.json`, portal `v0.6.15`,
SHA-256 `3e5bc8ef01a2c74650a2581beb9bcfee4dd14252bec8ab52542fa3240ab60475`: 253 operations and 57 entries in
`webhooks`, as in `v0.6.14`.

- **The common error format.** Every error response declares `error` (a stable code) and `message`: `422`
  `validation_failed` with `errors`, `404` `not_found`, `401` `unauthenticated`, `403` `forbidden` (or the codes of the
  entry point). `402 payment_required` came in on 142 operations (conversations and accounts), `429` with its limits on
  50, `502 provider_error` on four (a number's status and QR, marking as read, typing) and `409 device_not_connected`
  on a number's status. The node already read `error` and `message` of any status; the README lists the codes.
- **Texts and fields.** Seven descriptions in Spanish changed (the system tag "No contactar", which adding or removing
  tags does not touch, `422` on `errors.tag`; the monthly active contacts' `429` without `Retry-After`; connecting an
  official number with "Update a number"; a number's status without QR), and `is_system` and `opted_out` came in the
  responses of tags and contacts. The node's texts are its English ones, so nothing of that changes in it.
- **Parameters.** Only the order of the filters of "List conversations" (Name, Contact ID and Updated Since come
  first). No operation, parameter, group or event type came in or went out; there was no warning nor text to review.

## The copy of 2026-11-13 (portal `v0.6.14`)

The specification published at `https://developers-portal.funnelchat.app/specs/funnelchat.json`, portal `v0.6.14`,
SHA-256 `37c54a5aad4cc467e088af50294012484692ef668714dcdd748babc7314b587f`: 253 operations and 57 entries in
`webhooks` (56 event types, since `webhook.test` has two), as in `v0.6.13`.

- **Only two examples changed.** The example of `group.message_received` and `group.reaction_added` now identifies
  the message by `data.message.uid` (it showed `data.message.id`), which is what Funnelchat sends; the one of
  `group.message_received` also shows `caption`, `media_url`, `mime_type`, `file_name` and `quoted_uid`. The English
  description of both events no longer says the example differs (`scripts/events.en.json`).
- **Nothing else.** No operation, parameter, group or event type came in, went out or changed, so the generated table
  is the same but for the SHA-256. There was no warning nor text to review, and nothing of
  `scripts/generator.config.json` became unnecessary.

## The copy of 2026-11-11, final (portal `v0.6.13`)

The specification published at `https://developers-portal.funnelchat.app/specs/funnelchat.json`, portal `v0.6.13`,
SHA-256 `a7b480743848dabccbea2a1f2314263ca070316eeed97aab4a6f09f171c80e5a`: the final one of 2026-11-11.

- **Categories.** Each group of `x-tagGroups` has `x-fc-categoria`: `primer-uso` (1 group, `Mensajes`), `whatsapp` (9)
  and `funnelchat` (20). The root has `x-fc-categorias`, with the title and link of each one, which give their order.
  Their English names ("First use", "WhatsApp functions", "Funnelchat functions") are in `categories.names`. Each
  operation has the category of its group; a resource of the node that takes groups of several categories lists them
  all (Conversations and Messages has the three; Templates and Groups, two), so no operation changed resource.
- **Came in, 12 operations:** `GET /api/v1/me` ("Get my account", in Account and Team; it has no `operationId`, so its
  value in n8n is `get_api_v1_me`), eight of the alerts (the Alerts resource, no longer `optional`, with "List the
  alert types" as its default), a flow's detail and its nodes, and a scheduled send's result by group. Their English
  names were already written. The other six alert operations (a destination's creation, update and deletion, its
  verification code and its webhook test) are not published.
- **Nothing went out.** The event types did not change (56). Of the operations already there, only "List a stage's
  contacts" changed: two optional filters came in (`followUpFrom`, `followUpTo`).
- **`data.message.uid`.** In `group.message_received` and `group.reaction_added` production sends `message.uid`
  (verified against what Funnelchat sends in production, communities `v2.35.28`), although the published example
  shows `message.id`. The English
  description of both events says so (`scripts/events.en.json`).

## The copy of 2026-11-11 (portal `v0.6.12`)

The first one of that day, portal `v0.6.12` (SHA-256 `f8baa487…`, 241 operations), published at the same address
since 2026-11-11, without the category of its groups. It is the one 0.3.0 was first generated from.

**What changed against the copy of 2026-11-06** (the full specification `v0.6.7`, 266 operations, SHA-256
`38ae497a…`, and its two supplements):

- **Came in, 112 operations** the node did not have: broadcasts, automations and their folders, boards, tickets, quick
  replies, lead score, sales, group campaigns, scheduled sends, group statistics, Conversions API, custom domains,
  Meta costs and WhatsApp Business accounts, the team and the monthly active contacts, and adding or removing tags on
  many contacts at once.
- **Went out, 26 operations** the node had published, because the published specification does not have them: they
  are closed to API keys in production. The list is in the README ("What 0.3.0 removed") and in
  `test/fixtures/published-operations.json` (`removed`).
- **The WhatsApp forms** (18 routes) now come from the specification, with the same `operationId`s the
  `conversations-forms` supplement had: the supplement was removed.
- **The groups are the portal's.** The specification's tags are now the groups of the portal, in Spanish (`Números`,
  `Mensajes`, `Atender una conversación`, …). The resources of the node keep their values; the config lists which
  groups each one takes, and `operationResources` keeps in its resource each operation the node had published and the
  portal moved to another group (for example "List templates", now in `Mensajes`, stays in Templates).
- **The trigger's event list** comes from the specification's `webhooks` (the types a subscription takes, the enum of
  `events` in "Create a webhook subscription"): 55 types. Against the accounts `v1.5.97` catalog it had, two came in
  (`contact.updated` and `message.reaction_failed`) and the five `planned` ones went out (`billing.plan_blocked`,
  `subscription.expiring` and the three `ai_quota.*`). `spec/webhook-events.json` was removed.
- **The parameters** of the 129 operations that stayed (compared field by field with the table of 0.2.3): none
  disappeared, changed its name or became required, so saved workflows keep their values. Some came in (`only_paused`
  in "List contacts", `custom_fields` in "Create a contact" and "Create or update a contact", filters of the form
  responses and metrics). What changed, as the specification says:
  - "List forms" and "List a form's responses" ask for the page size with `perPage`; the supplement, written from the
    conversations code of `v1.18.10`, said `per_page`. Not checked against the code in production: if it still reads
    `per_page`, the API uses its own page size and "Return All" still goes through every page.
  - **From** and **To** of the form responses and metrics are a date and time (they were a date), and **Status** of the
    responses is free text (it was a list of options): the value a saved workflow has still fits.
  - `type` of "List custom fields" is now a list of options (0 to 4), which takes the number a saved workflow has; the
    one of "Create a custom field" stays a number (`keepFieldKinds`), as the node published it.
  - The forms' fields have no description in the specification: the English ones of the supplement are in
    `fieldDescriptionsByName`.

## What the config keeps on top of the specification

`scripts/generator.config.json` carries what saved workflows need and the specification cannot say.

- **`defaultResource`** (`contact`) and the **`defaultOperation`** of each resource: what a saved workflow runs if it
  never changed them. Pinned because new groups or operations could otherwise become the default, or the categories
  could reorder the resources. The default operation of Templates was "Get a template's quick reply buttons", which
  went out: it is now "List templates".
- **`operationResources`:** the ten operations the node had published whose group of the portal belongs to another
  resource (a contact's tags and custom fields, list, send and bring templates, list forms, send a form, a campaign's
  joins and leaves).
- **`keepOperationValues`:** `message.showMessage` → `showMessage` ("Get a message", published from a supplement with
  that value).
- **`topLevelFields`:** **Phone** and **Contact ID** of "Send a message" and "Send a template" are fields of their own.
- **`keepFieldKinds`:** `events` of "Create" and "Update a webhook subscription" stay as text separated by commas, and
  `orderBy` and `orderByMethod` of "List the scheduled sends that include a group" as free text, as the node published
  them, so the value a saved workflow has still fits.
- **`fieldDefaults`:** `type` of "Create a connect link" shows `qr` first (`meta` answers `503 meta_connect_disabled`
  while the official sign-up by link is off).
- **`extraParameters`:** `event_type` and `event_id` of "List a subscription's deliveries": accounts `v1.5.97` reads
  them and the specification does not list them.
- **`operationNotes` and `fieldDescriptionsByName`:** notices and English field descriptions of what the code requires
  and the specification does not say, checked against the production tags of each domain when they were written.

## Removed

They stay in the git history.

On 2026-11-11, with the published specification:

- `funnelchat.json` of 2026-11-06, the portal's **full** specification (`feat/plantillas-de-meta` @ `51c0aeb`,
  `v0.6.7`, 266 operations, SHA-256 `38ae497ab7e6089b31b589e1f93c2289524348d581796eba109568885642813c`), and before it
  the copies of 2026-11-05 (`0ffaad2b…`, `8228ea73…`), 2026-11-04 (`0f451fea…`) and 2026-10-15 (`8bbbae56…`).
- `supplements/conversations-forms.json`: the 18 WhatsApp form routes, written from conversations `v1.18.10`. The
  published specification has them with the same `operationId`s.
- `supplements/conversations-kept-2026-10-15.json`: the poll and the event invitation
  (`interactiveMessage.storePoll`, `.storeEvent`), still closed to API keys, which the node kept from 0.1.x. The
  portal does not publish them, so they went out.
- `webhook-events.json`: the event catalog of accounts `v1.5.97` (SHA-256 `6ceb64fe…`), extracted from its code. The
  trigger's built-in list now comes from the specification's `webhooks`.

Before (2026-11-04 and 2026-11-05): the supplements `communities-v2.35.5.json`, `accounts-webhook-subscriptions.json`,
`conversations-v1.18.10.json` and `accounts-v1.5.97.json`, when the full specification brought their routes.

## Webhook signature

The algorithm of `nodes/shared/signature.ts` and the vectors of `test/fixtures/firmas.json` come from
`developers-portal` `feat/armar-funnelchat-portal` @ `dd7cd42`: `snippets/verificar-firma.js` (and its PHP and Python
counterparts) and `tests/test_firmas.py`. They match `Signature` of `platform-gate` (`t=<unix>,v1=<hex>`, 300 s
tolerance), which is what accounts signs with.
