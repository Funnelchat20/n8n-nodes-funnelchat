# @funnelchat-hq/n8n-nodes-funnelchat

[n8n](https://n8n.io) community node for the Funnelchat public API. With it you build workflows that work with your
account without writing code: sync contacts from a form or a CRM, reply to messages, check the status of your numbers
or react to what happens in your account.

It has three parts:

- **"Funnelchat API" credential**: your API key and the environment (production, staging or a URL of your own, such
  as the sandbox).
- **"Funnelchat" node**: the API operations grouped as in the portal: contacts, conversations and messages,
  templates, WhatsApp forms, tags, custom fields, groups, numbers and webhooks. They are generated from the unified
  specification and from what the domains opened later.
- **"Funnelchat Trigger" node**: starts a workflow with each event Funnelchat sends by webhook, with its signature
  verified.

> [!IMPORTANT]
> **Status: published on npm** as `@funnelchat-hq/n8n-nodes-funnelchat` (with provenance) and installable from n8n's
> panel as a community node (see [Installation](#installation)). It is up to date with the API running in production
> on 2026-10-22 (accounts `v1.4.24`, conversations `v1.18.10`). The public API is v0 and may change: see
> [Sources and what is left to verify](#sources-and-what-is-left-to-verify).

API documentation: [Funnelchat developer portal](https://developers-portal.funnelchat.app/docs/).

## Contents

- [Installation](#installation)
- [Minimal example](#minimal-example)
- [Credential](#credential)
- [The Funnelchat node](#the-funnelchat-node)
- [The Funnelchat Trigger](#the-funnelchat-trigger)
- [Workflow examples](#workflow-examples)
- [Testing with the sandbox](#testing-with-the-sandbox)
- [Regenerating](#regenerating)
- [Development](#development)
- [Sources and what is left to verify](#sources-and-what-is-left-to-verify)

## Installation

### From n8n (community nodes)

In self-hosted n8n: **Settings → Community nodes → Install** and type `@funnelchat-hq/n8n-nodes-funnelchat`. n8n
downloads it from the public npm registry and makes it available in the nodes panel: search for "Funnelchat".

n8n Cloud only shows the nodes n8n has verified. The package is ready for that (strict mode, no runtime dependencies,
n8n lint passing), but it has not been submitted for verification yet.

### With npm, in n8n's nodes folder

```bash
mkdir -p ~/.n8n/nodes && cd ~/.n8n/nodes
npm init -y                       # only the first time
npm install @funnelchat-hq/n8n-nodes-funnelchat
```

Restart n8n. With Docker, that folder is `/home/node/.n8n/nodes` inside n8n's volume. It was tested with n8n 2.25.7
(image `n8nio/n8n`).

### From the source code

```bash
git clone https://github.com/Funnelchat20/n8n-nodes-funnelchat.git
cd n8n-nodes-funnelchat
npm ci
npm run build
npm pack            # creates funnelchat-hq-n8n-nodes-funnelchat-0.1.1.tgz
```

Then, in n8n's nodes folder, `npm install /path/to/funnelchat-hq-n8n-nodes-funnelchat-0.1.1.tgz`.

## Minimal example

A workflow that sends a message to a contact and keeps the message ID:

1. Create the **Funnelchat API** credential with your key (see [Credential](#credential)).
2. Add the **Funnelchat** node — resource "Conversations and Messages", operation "Send a message to a contact":
   - Contact ID (in the route and in the body): `2001`
   - Number ID: the ID of the number that sends, from "Numbers → List numbers".
   - Additional Fields → Phone: the contact's, `5491100000000`; Text: `Hello`; Client Reference: `order-981`.
3. Run it. You get one item with the queued message:

```json
{
	"id": 1001,
	"contact_id": 2001,
	"device_id": 7,
	"direction": "outbound",
	"type": "text",
	"status": "queued",
	"error": null,
	"client_reference": "order-981",
	"created_at": "2026-10-22T13:05:00Z",
	"updated_at": "2026-10-22T13:05:00Z"
}
```

The result (`sent`, `delivered`, `read` or `failed`) comes later: with the **Funnelchat Trigger** and the
`message.status_changed` event, which carries your `client_reference`, or by reading the message with "Get a message".

## Credential

1. In Funnelchat, go to the **Developers** screen and create a key with the permissions you will use. The key is shown
   only once and looks like `<id>|fc_live_…`.
2. In n8n, create a **Funnelchat API** credential:
   - **API Key**: the full key, including the leading `<id>|`. It is sent as `Authorization: Bearer <key>`.
   - **Environment**: **Production** (`https://api.funnelchat.com`), **Staging** (`https://api-staging.funnelchat.com`)
     or **Custom**, with a **Base URL** of your own: for example the local sandbox, `http://localhost:4010` (see
     [Testing with the sandbox](#testing-with-the-sandbox)). The base URL starts with `http://` or `https://`, does not
     end in `/` and has no `/api/v1`: the node adds it. Otherwise the credential test fails and the node sends nothing.
3. When you save it, n8n tests the credential with `GET /api/v1/me` ("Get my account"). **That test needs the
   `accounts:read` permission**: if your key does not have it, the test fails even if the key works for everything
   else. You can save it anyway.

Each operation of the node says which permission it needs (`conversations:read`, `conversations:write`,
`conversations:send`, `communities:read`, `accounts:read`, `accounts:write`, `accounts:operate`, `webhooks:read` or
`webhooks:write`). If it is missing, the API answers `403 permission_denied` and the node shows the `message`, which
says which one is missing. All keys are `fc_live_`: what the node does acts on real data and real numbers.

## The Funnelchat node

You choose a **resource** and an **operation**. Each operation shows in its description what it is for and which
permission it needs.

- **Fields.** The required ones are at the top (for example, "Contact ID"). The optional ones are added from
  **Filters** (in queries) or **Additional Fields** (in the body). Lists are typed separated by commas or come as a list
  from an expression. Structured fields (objects, lists of objects) are written in JSON.
- **JSON body.** In the operations that send a body, **Send Body as JSON** lets you write it in full, as the portal's
  reference describes it. It is useful to send `null` or complex structures.
- **Lists.** Paginated lists have **Return All**: when it is off, they bring up to the **Limit**. The node asks for the
  pages itself (by page number or by cursor, depending on the route) and returns one item per element.
- **Responses.** An object comes out as one item; a response without a body (`204`, `202`) comes out as
  `{ "success": true }`.
- **Sends.** With an API key, a send (message, template, contact card, form) answers `200` with the **queued message**
  (`status: "queued"`) and its `id`, and the node returns that message as an item (one per message for contact cards;
  one per target for a forward). **Client Reference** (`client_reference`, up to 64 ASCII characters without spaces)
  comes back in the message and in `message.status_changed`. Before going out, each send goes through WhatsApp's
  guards: the 24-hour window (`422 window_closed`, except templates), pace (`429 rate_limited`), anti-blocking
  (`422 antiblock_duplicate_content`, `antiblock_unanswered_limit`) and monthly active contacts
  (`429 mac_lockout_24h`, `mac_limit_reached`).
- **File by URL.** In "Send a message to a contact" and "Send a message", **File (URL)** accepts a URL, also signed or
  without an extension: in that case set **File Type** (`image`, `video`, `audio`, `document` or `sticker`) and, for a
  document, **File Name**. Without them the API answers `422` on `file_type` or `file_name`; an extension WhatsApp does
  not support, `415`.
- **Errors.** The node's error carries the API's `message` and, in its description, its `error` (stable code) and the
  response's **`X-Request-Id`**: quote it if you contact support. A `422` lists the fields with problems. A `429` with a
  `Retry-After` of up to 60 seconds is retried on its own, up to 3 times; if the wait is longer, the error says how long
  to wait. The API's entry point has its own errors: `404 route_not_found`, `502 origin_unreachable` and
  `500 edge_misconfigured`. **A `502` on a write is treated as a timeout**: it may have been applied, so read the state
  before repeating it (do not turn on **Retry On Fail** for sends). With **Continue On Fail**, the item comes out as
  `{ "error": "<code>", "message": "<text>", "httpCode": "<status>", "requestId": "<X-Request-Id>" }`.
- **Notices (⚠).** Some operations show a notice above their fields: what the API's code requires and the
  specification does not say, that a route is not open to API keys yet, or that the operation is irreversible.

The node can also be used as a tool of an n8n AI agent.

### Operations

<!-- operations:start (generated by npm run generate) -->

128 operations generated from the specification (sha256 `8bbbae569b4c`) and its supplements. The ones marked ⚠ show a notice in the node (what the code requires and the specification does not say, a route closed to keys, or an irreversible operation).

<details><summary><strong>Contacts</strong> (15)</summary>

| Operation | Route | Permission |
|---|---|---|
| List contacts "return all" | `GET /api/v1/contacts` | `conversations:read` |
| Create a contact | `POST /api/v1/contacts` | `conversations:write` |
| Create or update a contact | `POST /api/v1/contacts/update-or-create` | `conversations:write` |
| Set a custom field on contacts | `POST /api/v1/contacts/attach-custom-field` | `conversations:write` |
| Remove a custom field from contacts | `POST /api/v1/contacts/detach-custom-field` | `conversations:write` |
| Get a contact | `GET /api/v1/contacts/{contact}` | `conversations:read` |
| Update a contact | `PUT /api/v1/contacts/{contact}` | `conversations:write` |
| List a contact's tags "return all" | `GET /api/v1/contacts/{contact}/tags` | `conversations:read` |
| List a contact's custom fields "return all" | `GET /api/v1/contacts/{contact}/custom-fields` | `conversations:read` |
| Get a contact's 24-hour window | `GET /api/v1/contacts/{contact}/meta-window` | `conversations:read` |
| List a number's contacts "return all" | `GET /api/v1/devices/{device}/contacts` | `conversations:read` |
| Delete contacts | `POST /api/v1/contacts/delete` | `conversations:write` |
| List a contact's notes "return all" | `GET /api/v1/contacts/{contact}/notes` | `conversations:read` |
| Add a note to a contact | `POST /api/v1/contacts/{contact}/notes` | `conversations:write` |
| Delete a note | `DELETE /api/v1/contacts/{contact}/notes/{note}` | `conversations:write` |

</details>

<details><summary><strong>Conversations and Messages</strong> (18)</summary>

| Operation | Route | Permission |
|---|---|---|
| List conversations "return all" | `GET /api/v1/conversations` | `conversations:read` |
| Count unread conversations | `GET /api/v1/conversations/count/unread` | `conversations:read` |
| Count open conversations | `GET /api/v1/conversations/count/open` | `conversations:read` |
| Count closed conversations | `GET /api/v1/conversations/count/closed` | `conversations:read` |
| Count all conversations | `GET /api/v1/conversations/count/all` | `conversations:read` |
| Mark all as read | `POST /api/v1/conversations/mark-all-read` | `conversations:write` |
| Mark all as unread | `POST /api/v1/conversations/mark-all-unread` | `conversations:write` |
| Update a contact's conversation | `PUT /api/v1/contacts/{contact}/update` | `conversations:write` |
| Send a message to a contact ⚠ | `POST /api/v1/contacts/{contact}/message` | `conversations:send` |
| List a contact's messages "return all" | `GET /api/v1/contacts/{contactId}/messages` | `conversations:read` |
| Send a message ⚠ | `POST /api/v1/message/send-message` | `conversations:send` |
| Get a message | `GET /api/v1/contacts/{contact}/messages/{message}` | `conversations:read` |
| React to a message ⚠ | `PUT /api/v1/contacts/{contact}/messages/{message}/reaction` | `conversations:send` |
| Remove a reaction ⚠ | `DELETE /api/v1/contacts/{contact}/messages/{message}/reaction` | `conversations:send` |
| Forward a message ⚠ | `POST /api/v1/contacts/{contact}/messages/{message}/forward` | `conversations:send` |
| Send a poll ⚠ | `POST /api/v1/contacts/{contact}/message/poll` | `conversations:send` |
| Send an event invitation ⚠ | `POST /api/v1/contacts/{contact}/message/event` | `conversations:send` |
| Send a contact card ⚠ | `POST /api/v1/contacts/{contact}/message/contact-card` | `conversations:send` |

</details>

<details><summary><strong>Templates</strong> (7)</summary>

| Operation | Route | Permission |
|---|---|---|
| List templates "return all" | `GET /api/v1/templates` | `conversations:read` |
| Create a template | `POST /api/v1/templates` | `conversations:write` |
| Get a template | `GET /api/v1/templates/{template}` | `conversations:read` |
| Update a template | `PUT /api/v1/templates/{template}` | `conversations:write` |
| Get a template's quick reply buttons | `GET /api/v1/templates/{template}/quick-reply-buttons` | `conversations:read` |
| Send a template ⚠ | `POST /api/v1/devices/{device}/templates/{template}/send-template` | `conversations:send` |
| Delete a template from a number | `DELETE /api/v1/devices/{device}/templates/{template}` | `conversations:write` |

</details>

<details><summary><strong>WhatsApp Forms</strong> (19)</summary>

| Operation | Route | Permission |
|---|---|---|
| List forms "return all" | `GET /api/v1/forms` | `conversations:read` |
| Create a form | `POST /api/v1/forms` | `conversations:write` |
| List form templates | `GET /api/v1/forms/templates` | `conversations:read` |
| Get a form | `GET /api/v1/forms/{id}` | `conversations:read` |
| Save a form | `PUT /api/v1/forms/{id}` | `conversations:write` |
| Delete a draft form | `DELETE /api/v1/forms/{id}` | `conversations:write` |
| Get a form's numbers | `GET /api/v1/forms/{id}/numbers` | `conversations:read` |
| Add a number to a form | `POST /api/v1/forms/{id}/numbers` | `conversations:write` |
| Remove a number from a form | `DELETE /api/v1/forms/{id}/numbers/{deviceId}` | `conversations:write` |
| Retry publishing on the numbers | `POST /api/v1/forms/{id}/numbers/retry` | `conversations:write` |
| Create a new version of a form | `POST /api/v1/forms/{id}/versions` | `conversations:write` |
| Validate a form with Meta | `POST /api/v1/forms/{id}/sync` | `conversations:write` |
| Publish a form | `POST /api/v1/forms/{id}/publish` | `conversations:write` |
| Get a form's published definition | `GET /api/v1/forms/families/{familyId}/definition` | `conversations:read` |
| List a form's versions "return all" | `GET /api/v1/forms/families/{familyId}/versions` | `conversations:read` |
| List a form's responses "return all" | `GET /api/v1/forms/families/{familyId}/responses` | `conversations:read` |
| Get a form's response | `GET /api/v1/forms/families/{familyId}/responses/{runId}` | `conversations:read` |
| Get a form's metrics | `GET /api/v1/forms/families/{familyId}/metrics` | `conversations:read` |
| Send a form to a contact ⚠ | `POST /api/v1/contacts/{contact}/message/form` | `conversations:send` |

</details>

<details><summary><strong>Tags</strong> (6)</summary>

| Operation | Route | Permission |
|---|---|---|
| List tags "return all" | `GET /api/v1/tags` | `conversations:read` |
| Create a tag | `POST /api/v1/tags` | `conversations:write` |
| Get a tag | `GET /api/v1/tags/{tag}` | `conversations:read` |
| Update a tag | `PUT /api/v1/tags/{tag}` | `conversations:write` |
| List the contacts with a tag "return all" | `GET /api/v1/tags/{tag}/contacts` | `conversations:read` |
| Delete tags | `POST /api/v1/tags/delete` | `conversations:write` |

</details>

<details><summary><strong>Custom Fields</strong> (5)</summary>

| Operation | Route | Permission |
|---|---|---|
| List custom fields "return all" | `GET /api/v1/custom-fields` | `conversations:read` |
| Create a custom field | `POST /api/v1/custom-fields` | `conversations:write` |
| Delete custom fields | `POST /api/v1/custom-fields/delete` | `conversations:write` |
| Get a custom field | `GET /api/v1/custom-fields/{customField}` | `conversations:read` |
| Update a custom field | `PUT /api/v1/custom-fields/{customField}` | `conversations:write` |

</details>

<details><summary><strong>Groups</strong> (14)</summary>

| Operation | Route | Permission |
|---|---|---|
| List groups "return all" | `GET /api/v1/groups` | `communities:read` |
| List the groups a number manages "return all" | `GET /api/v1/devices/{device}/groups` | `communities:read` |
| List a number's announcement groups "return all" | `GET /api/v1/devices/{device}/ad-groups` | `communities:read` |
| List a number's channels "return all" | `GET /api/v1/devices/{device}/channels` | `communities:read` |
| Get a group's current data on WhatsApp | `GET /api/v1/groups/{groupUid}/metadata` | `communities:read` |
| Get a group | `GET /api/v1/groups/{group}` | `communities:read` |
| List the session actions on a group "return all" | `GET /api/v1/groups/{group}/actions` | `communities:read` |
| List the messages sent to a group "return all" | `GET /api/v1/groups/{group}/messages` | `communities:read` |
| List the scheduled sends that include a group "return all" | `GET /api/v1/groups/{group}/scheduled-messages` | `communities:read` |
| List a campaign's participants "return all" | `GET /api/v1/campaigns/{campaign}/participants` | `communities:read` |
| List participants with their current group "return all" | `GET /api/v1/campaigns/{campaign}/campaign-participants` | `communities:read` |
| List a campaign's joins and leaves "return all" | `GET /api/v1/campaigns/{campaign}/participant-events` | `communities:read` |
| List a group's participants "return all" | `GET /api/v1/groups/participants` | `communities:read` |
| List a group's joins and leaves "return all" | `GET /api/v1/groups/{group}/participant-events` | `communities:read` |

</details>

<details><summary><strong>Numbers</strong> (29)</summary>

| Operation | Route | Permission |
|---|---|---|
| List numbers "return all" | `GET /api/v1/devices` | `accounts:read` |
| Get a number's WhatsApp profile | `GET /api/v1/devices/{device}/me` | `accounts:read` |
| Check whether a phone has WhatsApp | `GET /api/v1/devices/{device}/check-phone` | `accounts:read` |
| Get a number | `GET /api/v1/devices/{device}` | `accounts:read` |
| Update a number | `PUT /api/v1/devices/{device}` | `accounts:write` |
| Delete a number ⚠ | `DELETE /api/v1/devices/{device}` | `accounts:operate` |
| Restart a number's session ⚠ | `PUT /api/v1/devices/{device}/reset` | `accounts:operate` |
| Set the received messages webhook | `PUT /api/v1/devices/{device}/update-webhook-received` | `accounts:write` |
| Set the received and delivery webhook | `PUT /api/v1/devices/{device}/update-webhook-received-and-delivery` | `accounts:write` |
| Clean a number ⚠ | `POST /api/v1/devices/{device}/clean` | `accounts:operate` |
| List a number's chats | `GET /api/v1/devices/{device}/chats` | `accounts:read` |
| Check which phones have an open conversation | `GET /api/v1/devices/{device}/open-conversations` | `accounts:read` |
| Get the message queue | `GET /api/v1/devices/{device}/message-queue` | `accounts:read` |
| Delete messages from the queue | `DELETE /api/v1/devices/{device}/message-queue` | `accounts:write` |
| Count the messages in the queue | `GET /api/v1/devices/{device}/message-queue/count` | `accounts:read` |
| Empty the message queue ⚠ | `DELETE /api/v1/devices/{device}/message-queue/all` | `accounts:operate` |
| Get the connection status | `GET /api/v1/devices/{device}/status` | `accounts:read` |
| Get a token for the WhatsApp Web extension | `POST /api/v1/devices/{device}/extension-token` | `accounts:write` |
| Get a number's health | `GET /api/v1/devices/{device}/health` | `accounts:read` |
| Refresh a number's health | `POST /api/v1/devices/{device}/health/refresh` | `accounts:write` |
| Get the connection history "return all" | `GET /api/v1/devices/{device}/connection-history` | `accounts:read` |
| List a number's logs "return all" | `GET /api/v1/devices/{device}/logs` | `accounts:read` |
| Get the logs health signal | `GET /api/v1/devices/{device}/logs/health` | `accounts:read` |
| List the logs of all numbers "return all" | `GET /api/v1/devices/logs` | `accounts:read` |
| Get the username | `GET /api/v1/devices/{device}/username` | `accounts:read` |
| Set the username | `POST /api/v1/devices/{device}/username` | `accounts:write` |
| Suggest usernames | `GET /api/v1/devices/{device}/username/suggestions` | `accounts:read` |
| Get the disconnection survey | `GET /api/v1/devices/{device}/disconnect-survey` | `accounts:read` |
| Answer the disconnection survey | `POST /api/v1/devices/{device}/disconnect-survey` | `accounts:write` |

</details>

<details><summary><strong>Webhooks</strong> (15)</summary>

| Operation | Route | Permission |
|---|---|---|
| List webhook subscriptions ⚠ | `GET /api/v1/webhooks` | `webhooks:read` |
| Create a webhook subscription ⚠ | `POST /api/v1/webhooks` | `webhooks:write` |
| Get a webhook subscription ⚠ | `GET /api/v1/webhooks/{id}` | `webhooks:read` |
| Update a webhook subscription ⚠ | `PUT /api/v1/webhooks/{id}` | `webhooks:write` |
| Delete a webhook subscription ⚠ | `DELETE /api/v1/webhooks/{id}` | `webhooks:write` |
| List a subscription's deliveries ⚠ "return all" | `GET /api/v1/webhooks/{id}/deliveries` | `webhooks:read` |
| Send a test event ⚠ | `POST /api/v1/webhooks/{id}/test` | `webhooks:write` |
| List event types | `GET /api/v1/webhooks/events` | `accounts:read` |
| List webhooks "return all" | `GET /api/v1/webhooks/endpoints` | `accounts:read` |
| Create a webhook | `POST /api/v1/webhooks/endpoints` | `accounts:write` |
| Get a webhook | `GET /api/v1/webhooks/endpoints/{id}` | `accounts:read` |
| Update a webhook | `PATCH /api/v1/webhooks/endpoints/{id}` | `accounts:write` |
| Delete a webhook | `DELETE /api/v1/webhooks/endpoints/{id}` | `accounts:write` |
| Choose a webhook's events | `PUT /api/v1/webhooks/endpoints/{id}/events` | `accounts:write` |
| List a webhook's deliveries "return all" | `GET /api/v1/webhooks/endpoints/{id}/deliveries` | `accounts:read` |

</details>

<!-- operations:end -->

## The Funnelchat Trigger

### How it works

1. You choose the **Events** from the list. The list comes from Funnelchat's catalog (`GET /api/v1/webhooks/events`):
   it shows the types that can be subscribed to, the read permission each one needs, and marks the ones that are not
   emitted yet (`planned`). If the key cannot read the catalog (it needs `accounts:read`), it shows the list built into
   the node, copied from the catalog of accounts `v1.4.24`: 53 types, among them `message.received`,
   `message.status_changed`, `whatsapp_form.completed`, `group.message_received`, `group_action.completed` and
   `group.reaction_added`.
2. When the workflow is **activated**, the node creates a subscription in Funnelchat (`POST /api/v1/webhooks`) with
   n8n's URL, those events and the description `n8n · <workflow name>`, and keeps the `id` and the secret Funnelchat
   returns only once.
3. Each delivery comes signed. The node **verifies the signature** before starting the workflow and **rejects with
   `400`** the ones that are not valid: the workflow does not run.
4. When the workflow is **deactivated**, the node deletes its subscription (`DELETE /api/v1/webhooks/{id}`). It only
   touches the one it created: the account's other subscriptions are left alone.

If you change the events or the filter and activate again, the node updates its subscription in place
(`PUT /api/v1/webhooks/{id}`) and the secret does not change. If the subscription no longer exists or was disabled, it
creates another one. **Listen for test event** creates a separate subscription for n8n's test URL and deletes it when
done.

**Options:** a **Description** of your own to recognize the subscription, and **Campaign IDs** to receive only the
events of those campaigns (`filters.campaign_ids`; with a filter, an event without a campaign does not arrive).

### What you need

- **A public `https` URL for n8n** (with Production or Staging). Funnelchat rejects `http` URLs, internal addresses
  and URLs with a user and password. In self-hosted n8n, set `WEBHOOK_URL` to your domain or use a tunnel. With a
  custom base URL (the sandbox), n8n's local URL works too, such as `http://localhost:5678`: the node does not filter
  the URL, the API decides.
- **A key of the account owner**, with `webhooks:read` and `webhooks:write` and the read permission of the area of each
  event you choose (for example, `conversations:read` for `message.received`, `communities:read` for the group events).
  Without the one of an area, creating the subscription answers `422` on `events`.
- **Room in the account:** there is a cap of 50 subscriptions per account.

### What reaches the workflow

One item per delivery, with the event envelope as Funnelchat sends it:

```json
{
	"id": "evt_000000000000000000000001",
	"type": "message.received",
	"version": 1,
	"occurred_at": "2026-10-01T12:00:00Z",
	"data": {
		"message": {
			"id": 1001,
			"type": "text",
			"text": "Hi, I'd like more information",
			"media": null
		},
		"contact": { "id": 2001, "name": "Sample contact", "phone": "+5491100000000" },
		"receiver": { "phone": "+5491100000001" },
		"device_id": 4521
	}
}
```

Delivery is "at least once": the same event may arrive twice with the same `id`. If your workflow does not tolerate
duplicates, keep the processed `id`s and drop the ones you have already seen. The format of each type is in the
portal's event catalog.

### The signature

Header `X-Funnelchat-Signature: t=<unix>,v1=<hex>`. `v1` is the HMAC-SHA256, with the full secret of the subscription
(including its `whsec_`), of `"<t>." + raw body`. There may be several `v1` (one match is enough) and `t` cannot be more
than 300 seconds away from n8n's clock: keep the server's clock in sync. The code is the one of the portal's snippet
(`snippets/verificar-firma.js`) and the tests use its same vectors (`tests/test_firmas.py`).

## Workflow examples

### Receive a message and reply

1. **Funnelchat Trigger** — Events: "Message received (message.received)".
2. **If** (optional) — continue only if `{{ $json.data.message.type }}` is `text`.
3. **Funnelchat** — resource "Conversations and Messages", operation "Send a message to a contact":
   - Contact ID (in the route and in the body): `{{ $json.data.contact.id }}`
   - Number ID: `{{ $json.data.device_id }}` (it may be `null`; then, the ID from "Numbers → List numbers").
   - Additional Fields → Phone: `{{ $json.data.contact.phone }}`. With an API key it is required (or WhatsApp ID) and
     must be the contact's: otherwise, `422 recipient_mismatch`.
   - Additional Fields → Text: `Thanks for writing to us! We will get back to you shortly.`

Reply within the contact's 24-hour window: outside it, WhatsApp requires a template ("Templates → Send a template") and
the send answers `422 window_closed`.

### Send a WhatsApp form and receive the answers

1. **Funnelchat** — resource "WhatsApp Forms", operation "Send a form to a contact": Contact ID, **Form ID** (the
   `family_id` from "List forms", not the ID of a version) and the ID of a number where it is published. You get the
   queued message, of type `whatsapp_form`.
2. In another workflow, **Funnelchat Trigger** with the event "WhatsApp form completed (whatsapp_form.completed)": it
   comes with `data.form`, `data.contact_id`, `data.message_id` (the ID the send returned) and `data.answers`, a list
   of `{key, label, value}`.

Forms are built, validated with Meta and published with the other operations of the resource ("Create a form", "Save a
form", "Validate a form with Meta", "Publish a form").

### Create a contact from a form

1. **n8n Form Trigger** — fields "Name", "Email" and "Phone" (or a **Webhook** that receives your form).
2. **Funnelchat** — resource "Contacts", operation "Create or update a contact":
   - Phone: `{{ $json["Phone"] }}`, with the country code (with or without `+`).
   - Additional Fields → Name: `{{ $json["Name"] }}`, Email: `{{ $json["Email"] }}`.

   If the phone already exists, it updates that contact; otherwise it creates it. It is safe to retry.

3. **Funnelchat** (optional) — operation "Add a note to a contact": Contact ID `{{ $json.id }}`, Note Text
   `Came from the website form`.

To find that contact by phone later, remove the `+`: the API stores the phone without `+` and the search by `phone`
does not remove it.

## Testing with the sandbox

[`funnelchat-sandbox`](https://github.com/Funnelchat20/funnelchat-sandbox) imitates the public API on your machine,
with in-memory state and signed webhooks, and has no real effects: nothing goes out to WhatsApp. How to start it is in
its README. By default it listens on `http://localhost:4010`.

1. **Start the sandbox**, for example with `npx @funnelchat-hq/sandbox` or
   `docker run --rm -p 4010:4010 funnelchat-sandbox`. Its panel is at `http://localhost:4010/_sandbox`.
2. **Create a Funnelchat API credential** for the sandbox:
   - **Environment**: **Custom**.
   - **Base URL**: `http://localhost:4010`. If n8n runs in Docker and the sandbox on your machine,
     `http://host.docker.internal:4010` (with Podman, `http://host.containers.internal:4010`).
   - **API Key**: `1|fc_live_sandbox`. The sandbox accepts any key shaped like a real one, and all of them have every
     permission.

   The credential test calls the sandbox's `GET /api/v1/me`.

3. **Actions.** Any operation of the node works against the sandbox. Contacts, conversations and messages, tags, custom
   fields, templates, WhatsApp forms, numbers and webhook subscriptions keep what you do; the rest answers an example
   built from the specification. Sending with an API key is open in the sandbox, with the API's 24-hour window and
   anti-spam guards, and every response carries `X-Request-Id`.
4. **Trigger.** The sandbox accepts `http` and local URLs, so an n8n on `http://localhost:5678` receives the events.
   Activate the workflow with the **Funnelchat Trigger** and simulate an incoming message:

   ```bash
   curl -s -X POST http://localhost:4010/_sandbox/inbound/message \
     -H 'Content-Type: application/json' \
     -d '{"phone": "5491100000000", "device_id": 3, "text": "Hello"}'
   ```

   The sandbox signs the delivery like the API, the node verifies the signature and the workflow starts with the
   `message.received` event. If n8n runs in Docker, set its `WEBHOOK_URL` to a URL the sandbox can reach (for example
   `http://localhost:5678/` publishing that port, or `http://host.docker.internal:5678/` if the sandbox runs in Docker
   too).

5. **What the sandbox does not show you:** with the real API, n8n's URL has to be `https` and public (try it with
   `npx @funnelchat-hq/sandbox --require-https`).

The end-to-end tests (`npm run test:e2e`, see [Development](#development)) passed on 2026-10-22 against the sandbox on
`feat/inicial` @ `7e244b8`: send and read a message, file by URL, `X-Request-Id` in errors, the signed
`message.status_changed` with the `client_reference`, and a WhatsApp form created, published, sent and completed
through the trigger. By hand, on 2026-10-16 with n8n 2.25.7 and the sandbox @ `7a1b3d8`: the credential test, a
workflow with "Create or update a contact" and "List tags", and the full trigger cycle.

## Regenerating

The node's operations are not written by hand: they come from `spec/funnelchat.json` with `npm run generate`. When
the portal publishes a new specification:

1. Copy the portal's unified specification (`out/specs/funnelchat.json`, built by its build) to
   `spec/funnelchat.json`.
2. Write down in `spec/PROVENANCE.md` where it came from: branch, commit, date and SHA-256
   (`shasum -a 256 spec/funnelchat.json`). The generator refuses to run if the SHA-256 is not there.
3. Run `npm run generate`. It updates `nodes/Funnelchat/generated/operations.ts` and this README's operations table,
   and warns about what is worth checking (for example, a config tag that no longer exists).
4. Review the diff and run `npm run lint`, `npm run build` and `npm test`.

What changes on its own, without touching code: new operations, permissions, fields and pagination. What is set in
`scripts/`:

- **English texts.** The portal's specification is in Spanish. The name and purpose of each of its operations are in
  `scripts/operations.en.json`: a new operation without an entry makes the generator stop and ask for one.
- **`scripts/generator.config.json`.** Which tags of the specification go into each resource, the English labels of
  the fields (the ones not listed show their API name), `fieldDescriptions` to replace field descriptions of the
  specification that are in Spanish or written for the domain's developers, and, in `operationNotes`, notices of what
  a domain's code requires and its specification does not say. When regenerating, check whether those notices are
  still needed.
- **Supplements.** `spec/supplements/` has what the specification does not have yet: the webhook subscriptions of
  accounts and, from conversations `v1.18.10`, sending with an API key, reading a message and the forms. They are
  written in English. If a new specification includes a route of a regular supplement, the generator uses the
  specification's and says the supplement is no longer needed. A supplement with `"replaces": true` (the conversations
  one) wins over the specification, with the same `operationId`, and the generator says so on every run: when the
  specification brings it up to date, remove it from the config.
- **Event catalog.** `spec/webhook-events.json` is a copy of `GET /api/v1/webhooks/events` (the trigger's fallback
  list). Replace it with a new copy (for example `snapshots/accounts/events.json` of the portal), write it down in
  `spec/PROVENANCE.md`, add the English label of any new type to `scripts/events.en.json` and regenerate.
- **Watch out for `operationId` changes.** The value of each operation in n8n is its `operationId`. If the
  specification changes it, saved workflows with the old operation stop finding it.

## Development

```bash
npm ci
npm run generate -- --check   # the generated files are up to date with spec/
npm run lint                  # n8n's linter for community nodes (strict mode)
npm run build
npm test                      # vitest, without network or keys: simulated responses
FUNNELCHAT_SANDBOX_URL=http://127.0.0.1:4010 npm run test:e2e   # e2e against a running sandbox
npm run dev                   # starts n8n on http://localhost:5678 with the node loaded
```

**Publishing:** push a `vX.Y.Z` tag on `main` matching the `package.json` version, and GitHub Actions
(`.github/workflows/publish.yml`) publishes it to npm with provenance.

- `nodes/Funnelchat/`: the action node. `generated/operations.ts` is the generated table; `description.ts` builds the
  fields from it and `request.ts` builds the requests (route, query and body) and the pagination.
- `nodes/FunnelchatTrigger/`: the trigger. `generated/events.ts` is the built-in event list.
- `nodes/shared/`: the transport (key, base URL, errors, `429`) and the signature check.
- `test/`: the signature with the portal's vectors, building requests and pagination, the trigger's create, check and
  delete cycle, and the custom base URL.
- `test/e2e/`: the node with real HTTP against the sandbox: send and read a message, file by URL, `X-Request-Id` in
  errors, the trigger cycle with a really signed event, and a WhatsApp form end to end. Without
  `FUNNELCHAT_SANDBOX_URL` it is skipped.

## Sources and what is left to verify

| What                                                    | Where it comes from                                                              | Status on 2026-10-22                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| The unified specification (most operations)             | developers-portal, the same one the portal publishes (domain snapshots of 13-10) | Published; the portal regenerates it from the production tags                              |
| Sending with an API key, message by ID and forms        | conversations tag `v1.18.10` (production), read from the code                    | Open to API keys. The new `operationId`s are not checked against a generated specification |
| Webhook subscriptions (trigger and Webhooks resource)   | accounts tag `v1.4.24` (production), read from the code                          | Open to API keys with `webhooks:read` / `webhooks:write`                                   |
| The trigger's fallback event catalog                    | accounts tag `v1.4.24`, extracted from the code                                  | 54 types, 49 being emitted                                                                 |
| The signature algorithm and vectors, the event envelope | developers-portal (`snippets/verificar-firma.js`, `tests/test_firmas.py`)        | Published                                                                                  |
| The local sandbox of "Testing with the sandbox"         | funnelchat-sandbox `feat/inicial` @ `7e244b8`                                    | funnelchat-sandbox PR #1, not merged                                                       |

The details of each source are in [`spec/PROVENANCE.md`](spec/PROVENANCE.md).
