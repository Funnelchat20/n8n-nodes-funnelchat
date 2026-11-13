# @funnelchat-hq/n8n-nodes-funnelchat

[n8n](https://n8n.io) community node for the Funnelchat public API: connect your WhatsApp numbers, send messages and
know when they are read, receive messages and work with your groups, from your workflows and without code.

**It covers every function the developer portal publishes** — the WhatsApp functions and the Funnelchat functions, the
ones listed in [More functions](https://developers-portal.funnelchat.app/docs/mas-funciones/) — and nothing the portal
leaves out. See [Operations](#operations).

## First use

1. **Install the node.** In n8n, **Settings → Community nodes → Install** and type
   `@funnelchat-hq/n8n-nodes-funnelchat` (other ways in [Installation](#installation)).
2. **Create your key.** In the Funnelchat panel, **Developers → Create key**. It is shown **only once**: copy it then.
   If you also use it from code, keep it in the `FUNNELCHAT_API_KEY` environment variable, never in the code.
3. **Add the credential.** In n8n, create a **Funnelchat API** credential: paste the key in **API Key** and leave
   **Environment** on **Production**. n8n keeps it encrypted.
4. **Connect a number.** Skip it if you already have one: **Funnelchat → Numbers → List numbers** gives its `id`.
   Otherwise, a **Funnelchat** node with **Numbers → Create a connect link**, **Type** `qr`. Run it and open the `url`
   of the result: the page shows a QR code. Scan it with WhatsApp on your phone (**Linked devices**). The number's `id`
   is then in **List numbers**, and in **Get a connect link** (`device_id`).
5. **Send a message and know when it was read**: a workflow with two nodes.
   - **Funnelchat**: **Conversations and Messages → Send a message**. **Number ID**: your number's `id`. **Phone**:
     the recipient's, with the country code (`5491100000000`). No need to create the contact first: if the phone is
     new, Funnelchat creates it in your key's workspace (that takes `conversations:write`). **Additional Fields**:
     **Text** `Hello!` and **Client Reference** `order-981`.
   - **Funnelchat Trigger**: **Event Names or IDs**: Message status changed (`message.status_changed`).

   Activate the workflow (that subscribes the trigger) and click **Execute step** on the **Funnelchat** node. The send
   answers at once with the message in `status: "queued"` and its `contact_id`. Then the trigger starts once per
   status, `sent`,
   `delivered` and `read` (or `failed`, with its `error`), with your `client_reference` and your workspace:

   ```json
   {
   	"id": "evt_000000000000000000000002",
   	"type": "message.status_changed",
   	"version": 1,
   	"occurred_at": "2026-11-04T12:00:05Z",
   	"data": {
   		"message_id": 1001,
   		"contact_id": 2001,
   		"device_id": 4,
   		"status": "read",
   		"previous_status": "delivered",
   		"error": null,
   		"occurred_at": "2026-11-04T12:00:05Z",
   		"client_reference": "order-981",
   		"workspace_id": 37
   	}
   }
   ```

   The trigger needs n8n reachable from the internet over `https` (in self-hosted n8n, `WEBHOOK_URL`): see
   [What you need](#what-you-need). With an official WhatsApp number, the first message to a new contact has to be a
   template (**Templates → Send a template**, with the same **Phone**): a free message only goes out within 24 hours
   of the contact's last message. A number connected by QR has no such rule. If a template you created in Meta does
   not show in **Templates → List templates**, bring it with **Templates → Bring templates from Meta** (official
   numbers only; the key needs `conversations:write`) and list again.

<details><summary>The same two nodes, to paste on the canvas (then choose your credential in both)</summary>

```json
{
	"nodes": [
		{
			"name": "Send a message",
			"type": "@funnelchat-hq/n8n-nodes-funnelchat.funnelchat",
			"typeVersion": 1,
			"position": [0, 0],
			"parameters": {
				"resource": "conversation",
				"operation": "message.sendMessage",
				"device_id": "4",
				"phone": "5491100000000",
				"additionalFields": { "text": "Hello!", "client_reference": "order-981" }
			}
		},
		{
			"name": "When its status changes",
			"type": "@funnelchat-hq/n8n-nodes-funnelchat.funnelchatTrigger",
			"typeVersion": 1,
			"position": [0, 240],
			"parameters": { "events": ["message.status_changed"] }
		}
	],
	"connections": {}
}
```

</details>

**What the key needs** for all of this: `accounts:read` (list numbers, and the credential test), `accounts:operate`
(connect a number), `conversations:write` (sending to a phone that is not a contact yet creates the contact, as
**Create or update a contact** does; it includes `conversations:send`, and without it that send answers `403`),
`conversations:read`, `webhooks:read` and `webhooks:write` (the trigger on message events). Sending to a phone or a
contact you already have, in your key's workspace, only needs `conversations:send`. A key with full access has them
all.

### Receive messages

**Funnelchat Trigger** with **Message received** (`message.received`). Each message brings `data.message` (`id`,
`type`, `text`, `media`), `data.contact` (`id`, `name`, `phone`), `data.device_id` and `data.workspace_id`. To answer
it, see [Receive a message and reply](#receive-a-message-and-reply). Your numbers tell you when they connect or
disconnect with **Number connected** (`device.connected`) and **Number disconnected** (`device.disconnected`, with its
`reason`).

### Groups

Everything starts from your number, without the panel:

1. **Groups → List the groups a number manages** (**Number ID**): the number's WhatsApp groups, read live (with a key
   the list is reused for one minute). Each one brings its `uid`; the ones already in your account also bring
   `device_id`. Your account's groups are in **Groups → List groups**.
2. **Groups → Send a message to a group**: **Group UID** (from that list), **Number ID** (connected, and an admin of
   the group if it is a QR number), **Type** `text` and **Additional Fields → Text**. A group that is not in your
   account yet is imported first. It answers at once with an `action_id`; **Groups → Get a group action** says how it
   went, and so do the `group_action.completed` and `group_action.failed` events.
3. **Groups → Follow a group** (**Group UID**, **Number ID**) to know who joins and who leaves without writing to it:
   it imports the group (QR numbers only), and from then on a **Funnelchat Trigger** with **Participant joined**
   (`group_participant.joined`) and **Participant left** (`group_participant.left`) receives them.

The key needs `communities:read` to list and receive the events, `communities:send` to send, and
`communities:operate` to import a group, which is what following it, or writing to one not yet in your account, does
(without it, `403 import_permission_required`). A number imports up to 5 groups per minute.

### Workspaces

Each API key sees and operates only the workspace where it was created: numbers, contacts, groups and webhook
subscriptions of other workspaces do not show up, as if they did not exist. The trigger's subscription belongs to the
key's workspace and receives only its events, and every event says which one in `data.workspace_id`. One integration
per workspace: one key, and one credential, for each.

---

## Reference

- [Installation](#installation)
- [Credential](#credential)
- [The Funnelchat node](#the-funnelchat-node)
- [The Funnelchat Trigger](#the-funnelchat-trigger)
- [Workflow examples](#workflow-examples)
- [Testing with the sandbox](#testing-with-the-sandbox)
- [Regenerating](#regenerating)
- [Development](#development)
- [Sources and what is left to verify](#sources-and-what-is-left-to-verify)

API documentation: [Funnelchat developer portal](https://developers-portal.funnelchat.app/docs/).

The package has three parts: the **Funnelchat API** credential (your key and the environment: production, staging or
a URL of your own, such as the sandbox); the **Funnelchat** node, with every operation of the API the portal
publishes, grouped as in the portal and generated from its published specification; and the **Funnelchat Trigger**,
which starts a workflow with each event Funnelchat sends by webhook, with its signature verified.

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
npm pack            # creates funnelchat-hq-n8n-nodes-funnelchat-0.3.4.tgz
```

Then, in n8n's nodes folder, `npm install /path/to/funnelchat-hq-n8n-nodes-funnelchat-0.3.4.tgz`.

## Credential

1. In Funnelchat, go to the **Developers** screen and create a key with the permissions you will use. The key is shown
   only once and looks like `<id>|fc_live_…`.
2. In n8n, create a **Funnelchat API** credential:
   - **API Key**: the full key, including the leading `<id>|`. It is sent as `Authorization: Bearer <key>`.
   - **Environment**: **Production** (`https://api.funnelchat.com`), **Staging** (`https://api-staging.funnelchat.com`)
     or **Custom**, with a **Base URL** of your own: for example the local sandbox, `http://localhost:4010` (see
     [Testing with the sandbox](#testing-with-the-sandbox)). The base URL starts with `http://` or `https://`, does not
     end in `/` and has no `/api/v1`: the node adds it. Otherwise the credential test fails and the node sends nothing.
     With an `fc_live_` key (every real key), the base URL has to be `https://`, or `http://` to this machine only
     (`localhost`, `127.0.0.1` or `[::1]`, the local sandbox): with another host the node stops with an error before
     sending anything, and the credential test fails on `live-key-needs-https.invalid`.
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
- **Errors.** Every error of the API carries `error`, a stable code (the one to compare), and `message`, a text for
  people that may change. The node's error carries the `message` and, in its description, the `error` and the
  response's **`X-Request-Id`**: quote it if you contact support. The common ones:
  - `402 payment_required`: the account's payment is overdue; settle it in Funnelchat to keep using the API.
  - `404 not_found` (or a code of its own, like `group_not_found`): it does not exist or it is of another account; the
    API does not tell them apart.
  - `422 validation_failed`, with `errors`: the node lists the fields with problems.
  - `429 rate_limited` (a limit per minute) or `daily_cap_exceeded` (per day), with `Retry-After`: a wait of up to 60
    seconds is retried on its own, up to 3 times; if it is longer, the error says how long to wait. The monthly active
    contacts' `429 mac_lockout_24h` and `mac_limit_reached` come without `Retry-After`: retrying does not help.
  - `502 provider_error`: WhatsApp's provider did not answer (a number's status, QR or username, marking as
    read, typing); try again.

  The API's entry point has its own errors: `404 route_not_found`, `502 origin_unreachable` and
  `500 edge_misconfigured`. **A `502` on a write is treated as a timeout**: it may have been applied, so read the state
  before repeating it (do not turn on **Retry On Fail** for sends). With **Continue On Fail**, the item comes out as
  `{ "error": "<code>", "message": "<text>", "httpCode": "<status>", "requestId": "<X-Request-Id>" }`.
- **Notices (⚠).** Some operations show a notice above their fields: what the API's code requires and the
  specification does not say, or that the operation is irreversible.

### As a tool of an AI agent

The node can be used as a tool of an n8n AI agent, with every operation of the portal. Each operation's description
says what it is for and which permission it needs, and that is what the agent reads. **Every operation that deletes
(every `DELETE` route, and the deletions that go by `POST`, such as "Delete contacts" or "Delete tags") and every one
the specification marks with `x-fc-destructive` (such as "Restart a number's session" or "Clean a number") ends its
description with "Irreversible: ask for confirmation before running it."** and shows the ⚠ notice: tell your agent, in
its system message, to ask the person and wait for a yes before running one of them. The node decides it from the
specification, so a new deletion asks for confirmation too. Give the credential's key only the permissions the agent
needs.

### Operations

All the operations the developer portal publishes, in its categories:

- **[First use](https://developers-portal.funnelchat.app/):** send a message or a template to a phone, list your
  templates, bring the ones you created in Meta and see how a message went.
- **[WhatsApp functions](https://developers-portal.funnelchat.app/docs/mas-funciones/whatsapp/):** numbers, connect
  links and their message queue, groups and group actions, answering a conversation (reactions, forwards, contact
  cards, read and typing), templates, WhatsApp forms, Conversions API, and Meta costs and accounts.
- **[Funnelchat functions](https://developers-portal.funnelchat.app/docs/mas-funciones/funnelchat/):** contacts and
  their notes, conversations, tags, custom fields, automations and their folders, group campaigns, scheduled sends and
  their statistics, broadcasts, boards, tickets, quick replies, lead score, sales, custom domains, your account and
  team, alerts and webhooks.

The portal explains them in [More functions](https://developers-portal.funnelchat.app/docs/mas-funciones/). In the node,
each group of the portal is in a resource, and each operation has the category of its group. A resource can take
groups of more than one category (**Conversations and Messages** has operations of the three): its description in the
node lists them, and the resources go by the first one. The table below goes category by category, so such a
resource shows up in each one with the operations of that category.

<!-- operations:start (generated by npm run generate) -->

253 operations in 25 resources, and 55 event types in the trigger's built-in list, generated from the portal's published specification (sha256 `7db2ead82669`). The ones marked ⚠ show a notice in the node: what the code requires and the specification does not say, or an irreversible operation.

#### [First use](https://developers-portal.funnelchat.app/) (5)

<details><summary><strong>Conversations and Messages</strong> (2)</summary>

| Operation | Route | Permission |
|---|---|---|
| Send a message ⚠ | `POST /api/v1/message/send-message` | `conversations:send` |
| Get a message | `GET /api/v1/contacts/{contact}/messages/{message}` | `conversations:read` |

</details>

<details><summary><strong>Templates</strong> (3)</summary>

| Operation | Route | Permission |
|---|---|---|
| List templates "return all" | `GET /api/v1/templates` | `conversations:read` |
| Bring templates from Meta ⚠ | `POST /api/v1/devices/{device}/templates` | `conversations:write` |
| Send a template ⚠ | `POST /api/v1/devices/{device}/templates/{template}/send-template` | `conversations:send` |

</details>

#### [WhatsApp functions](https://developers-portal.funnelchat.app/docs/mas-funciones/whatsapp/) (87)

<details><summary><strong>Conversations and Messages</strong> (7)</summary>

| Operation | Route | Permission |
|---|---|---|
| Send a contact card ⚠ | `POST /api/v1/contacts/{contact}/message/contact-card` | `conversations:send` |
| Send a message to a contact ⚠ | `POST /api/v1/contacts/{contact}/message` | `conversations:send` |
| Forward a message ⚠ | `POST /api/v1/contacts/{contact}/messages/{message}/forward` | `conversations:send` |
| Mark a message as read | `POST /api/v1/contacts/{contact}/messages/{message}/read` | `conversations:send` |
| React to a message ⚠ | `PUT /api/v1/contacts/{contact}/messages/{message}/reaction` | `conversations:send` |
| Remove a reaction ⚠ | `DELETE /api/v1/contacts/{contact}/messages/{message}/reaction` | `conversations:send` |
| Show "typing…" to a contact | `POST /api/v1/contacts/{contact}/typing` | `conversations:send` |

</details>

<details><summary><strong>Templates</strong> (5)</summary>

| Operation | Route | Permission |
|---|---|---|
| Create a template | `POST /api/v1/templates` | `conversations:write` |
| Get a template | `GET /api/v1/templates/{template}` | `conversations:read` |
| Update a template | `PUT /api/v1/templates/{template}` | `conversations:write` |
| Delete a template from a number ⚠ | `DELETE /api/v1/devices/{device}/templates/{template}` | `conversations:write` |
| Get a template's metrics | `GET /api/v1/templates/{template}/metrics` | `conversations:read` |

</details>

<details><summary><strong>WhatsApp Forms</strong> (19)</summary>

| Operation | Route | Permission |
|---|---|---|
| List form templates | `GET /api/v1/forms/templates` | `conversations:read` |
| Create a form | `POST /api/v1/forms` | `conversations:write` |
| Get a form's metrics | `GET /api/v1/forms/families/{familyId}/metrics` | `conversations:read` |
| List a form's responses "return all" | `GET /api/v1/forms/families/{familyId}/responses` | `conversations:read` |
| Get a form's response | `GET /api/v1/forms/families/{familyId}/responses/{runId}` | `conversations:read` |
| List a form's versions "return all" | `GET /api/v1/forms/families/{familyId}/versions` | `conversations:read` |
| Get a form's published definition | `GET /api/v1/forms/families/{familyId}/definition` | `conversations:read` |
| Get a form | `GET /api/v1/forms/{id}` | `conversations:read` |
| Save a form | `PUT /api/v1/forms/{id}` | `conversations:write` |
| Delete a draft form ⚠ | `DELETE /api/v1/forms/{id}` | `conversations:write` |
| Get a form's numbers | `GET /api/v1/forms/{id}/numbers` | `conversations:read` |
| Add a number to a form | `POST /api/v1/forms/{id}/numbers` | `conversations:write` |
| Create a new version of a form | `POST /api/v1/forms/{id}/versions` | `conversations:write` |
| Validate a form with Meta | `POST /api/v1/forms/{id}/sync` | `conversations:write` |
| Publish a form | `POST /api/v1/forms/{id}/publish` | `conversations:write` |
| Remove a number from a form ⚠ | `DELETE /api/v1/forms/{id}/numbers/{deviceId}` | `conversations:write` |
| Retry publishing on the numbers | `POST /api/v1/forms/{id}/numbers/retry` | `conversations:write` |
| List forms "return all" | `GET /api/v1/forms` | `conversations:read` |
| Send a form to a contact ⚠ | `POST /api/v1/contacts/{contact}/message/form` | `conversations:send` |

</details>

<details><summary><strong>Groups</strong> (27)</summary>

| Operation | Route | Permission |
|---|---|---|
| List groups "return all" | `GET /api/v1/groups` | `communities:read` |
| List the groups a number manages ⚠ "return all" | `GET /api/v1/devices/{device}/groups` | `communities:read` |
| List a number's announcement groups "return all" | `GET /api/v1/devices/{device}/ad-groups` | `communities:read` |
| List a number's channels "return all" | `GET /api/v1/devices/{device}/channels` | `communities:read` |
| Get a group's current data on WhatsApp | `GET /api/v1/groups/{groupUid}/metadata` | `communities:read` |
| Follow a group ⚠ | `POST /api/v1/groups/{group}/import` | `communities:operate` |
| Get a group | `GET /api/v1/groups/{group}` | `communities:read` |
| List the scheduled sends that include a group "return all" | `GET /api/v1/groups/{group}/scheduled-messages` | `communities:read` |
| Send a message to a group ⚠ | `POST /api/v1/groups/{group}/messages` | `communities:send` |
| List a group's participants "return all" | `GET /api/v1/groups/participants` | `communities:read` |
| List a group's joins and leaves "return all" | `GET /api/v1/groups/{group}/participant-events` | `communities:read` |
| Create a group ⚠ | `POST /api/v1/groups` | `communities:operate` |
| List the session actions on a group "return all" | `GET /api/v1/groups/{group}/actions` | `communities:read` |
| Get a group action ⚠ | `GET /api/v1/groups/actions/{action}` | `communities:read` |
| Add participants to a group ⚠ | `POST /api/v1/groups/{group}/participants` | `communities:operate` |
| Remove participants from a group ⚠ | `POST /api/v1/groups/{group}/participants/remove` | `communities:operate` |
| Make participants admins ⚠ | `POST /api/v1/groups/{group}/admins` | `communities:operate` |
| Remove the admin role ⚠ | `POST /api/v1/groups/{group}/admins/remove` | `communities:operate` |
| Rename a group ⚠ | `PUT /api/v1/groups/{group}/name` | `communities:operate` |
| Change a group's description ⚠ | `PUT /api/v1/groups/{group}/description` | `communities:operate` |
| Change a group's photo ⚠ | `PUT /api/v1/groups/{group}/photo` | `communities:operate` |
| Change who can write in a group ⚠ | `PUT /api/v1/groups/{group}/settings` | `communities:operate` |
| Renew a group's invite link ⚠ | `POST /api/v1/groups/{group}/invite-link/renew` | `communities:operate` |
| Get a group's live invite link ⚠ | `GET /api/v1/groups/{group}/invite-link/live` | `communities:read` |
| List a group's join requests ⚠ | `GET /api/v1/groups/{group}/join-requests` | `communities:read` |
| Approve join requests ⚠ | `POST /api/v1/groups/{group}/join-requests/approve` | `communities:operate` |
| Reject join requests ⚠ | `POST /api/v1/groups/{group}/join-requests/reject` | `communities:operate` |

</details>

<details><summary><strong>Numbers</strong> (23)</summary>

| Operation | Route | Permission |
|---|---|---|
| List connect links "return all" | `GET /api/v1/connect-links` | `accounts:read` |
| Create a connect link ⚠ | `POST /api/v1/connect-links` | `accounts:operate` |
| Get a connect link ⚠ | `GET /api/v1/connect-links/{link}` | `accounts:read` |
| Revoke a connect link ⚠ | `DELETE /api/v1/connect-links/{link}` | `accounts:operate` |
| List numbers "return all" | `GET /api/v1/devices` | `accounts:read` |
| Create a number to connect by QR ⚠ | `POST /api/v1/devices` | `accounts:operate` |
| Get a number | `GET /api/v1/devices/{device}` | `accounts:read` |
| Update a number | `PUT /api/v1/devices/{device}` | `accounts:write` |
| Delete a number ⚠ | `DELETE /api/v1/devices/{device}` | `accounts:operate` |
| Restart a number's session ⚠ | `PUT /api/v1/devices/{device}/reset` | `accounts:operate` |
| Clean a number ⚠ | `POST /api/v1/devices/{device}/clean` | `accounts:operate` |
| Get the connection status | `GET /api/v1/devices/{device}/status` | `accounts:read` |
| Get the connection history "return all" | `GET /api/v1/devices/{device}/connection-history` | `accounts:read` |
| Get a number's health | `GET /api/v1/devices/{device}/health` | `accounts:read` |
| Refresh a number's health | `POST /api/v1/devices/{device}/health/refresh` | `accounts:write` |
| Get a number's QR code ⚠ | `GET /api/v1/devices/{device}/qr` | `accounts:operate` |
| Get the username | `GET /api/v1/devices/{device}/username` | `accounts:read` |
| Set the username | `POST /api/v1/devices/{device}/username` | `accounts:write` |
| Suggest usernames | `GET /api/v1/devices/{device}/username/suggestions` | `accounts:read` |
| Get the message queue | `GET /api/v1/devices/{device}/message-queue` | `accounts:read` |
| Delete messages from the queue ⚠ | `DELETE /api/v1/devices/{device}/message-queue` | `accounts:write` |
| Count the messages in the queue | `GET /api/v1/devices/{device}/message-queue/count` | `accounts:read` |
| Empty the message queue ⚠ | `DELETE /api/v1/devices/{device}/message-queue/all` | `accounts:operate` |

</details>

<details><summary><strong>Meta Costs and Accounts</strong> (3)</summary>

| Operation | Route | Permission |
|---|---|---|
| List your WhatsApp Business accounts "return all" | `GET /api/v1/me/whatsapp-business-accounts` | `accounts:read` |
| Get a WhatsApp Business account | `GET /api/v1/me/whatsapp-business-accounts/{wabaId}` | `accounts:read` |
| Get your WhatsApp costs | `GET /api/v1/me/whatsapp-costs` | `accounts:read` |

</details>

<details><summary><strong>Conversions API</strong> (3)</summary>

| Operation | Route | Permission |
|---|---|---|
| Set up a number's dataset | `POST /api/v1/devices/{device}/capi/dataset` | `accounts:write` |
| Test the Conversions API connection | `GET /api/v1/devices/{device}/capi/test` | `accounts:read` |
| List your Conversions API datasets "return all" | `GET /api/v1/devices/capi/datasets` | `accounts:read` |

</details>

#### [Funnelchat functions](https://developers-portal.funnelchat.app/docs/mas-funciones/funnelchat/) (161)

<details><summary><strong>Conversations and Messages</strong> (8)</summary>

| Operation | Route | Permission |
|---|---|---|
| List conversations "return all" | `GET /api/v1/conversations` | `conversations:read` |
| Count unread conversations | `GET /api/v1/conversations/count/unread` | `conversations:read` |
| Count open conversations | `GET /api/v1/conversations/count/open` | `conversations:read` |
| Count closed conversations | `GET /api/v1/conversations/count/closed` | `conversations:read` |
| Count all conversations | `GET /api/v1/conversations/count/all` | `conversations:read` |
| Mark all as read | `POST /api/v1/conversations/mark-all-read` | `conversations:write` |
| Mark all as unread | `POST /api/v1/conversations/mark-all-unread` | `conversations:write` |
| List a contact's messages "return all" | `GET /api/v1/contacts/{contactId}/messages` | `conversations:read` |

</details>

<details><summary><strong>Groups</strong> (1)</summary>

| Operation | Route | Permission |
|---|---|---|
| List a campaign's joins and leaves "return all" | `GET /api/v1/campaigns/{campaign}/participant-events` | `communities:read` |

</details>

<details><summary><strong>Contacts</strong> (15)</summary>

| Operation | Route | Permission |
|---|---|---|
| List contacts "return all" | `GET /api/v1/contacts` | `conversations:read` |
| Create a contact | `POST /api/v1/contacts` | `conversations:write` |
| Create or update a contact | `POST /api/v1/contacts/update-or-create` | `conversations:write` |
| Get a contact | `GET /api/v1/contacts/{contact}` | `conversations:read` |
| Update a contact | `PUT /api/v1/contacts/{contact}` | `conversations:write` |
| Get a contact's 24-hour window | `GET /api/v1/contacts/{contact}/meta-window` | `conversations:read` |
| List a number's contacts "return all" | `GET /api/v1/devices/{device}/contacts` | `conversations:read` |
| Delete contacts ⚠ | `POST /api/v1/contacts/delete` | `conversations:write` |
| List a contact's notes "return all" | `GET /api/v1/contacts/{contact}/notes` | `conversations:read` |
| Add a note to a contact | `POST /api/v1/contacts/{contact}/notes` | `conversations:write` |
| Delete a note ⚠ | `DELETE /api/v1/contacts/{contact}/notes/{note}` | `conversations:write` |
| Set a custom field on contacts | `POST /api/v1/contacts/attach-custom-field` | `conversations:write` |
| Remove a custom field from contacts | `POST /api/v1/contacts/detach-custom-field` | `conversations:write` |
| List a contact's tags "return all" | `GET /api/v1/contacts/{contact}/tags` | `conversations:read` |
| List a contact's custom fields "return all" | `GET /api/v1/contacts/{contact}/custom-fields` | `conversations:read` |

</details>

<details><summary><strong>Tags</strong> (8)</summary>

| Operation | Route | Permission |
|---|---|---|
| Add tags to contacts | `POST /api/v1/contacts/add-tags` | `conversations:send` |
| Remove tags from contacts | `POST /api/v1/contacts/remove-tags` | `conversations:write` |
| List tags "return all" | `GET /api/v1/tags` | `conversations:read` |
| Create a tag | `POST /api/v1/tags` | `conversations:write` |
| Get a tag | `GET /api/v1/tags/{tag}` | `conversations:read` |
| Update a tag | `PUT /api/v1/tags/{tag}` | `conversations:write` |
| List the contacts with a tag "return all" | `GET /api/v1/tags/{tag}/contacts` | `conversations:read` |
| Delete tags ⚠ | `POST /api/v1/tags/delete` | `conversations:write` |

</details>

<details><summary><strong>Custom Fields</strong> (5)</summary>

| Operation | Route | Permission |
|---|---|---|
| List custom fields "return all" | `GET /api/v1/custom-fields` | `conversations:read` |
| Create a custom field | `POST /api/v1/custom-fields` | `conversations:write` |
| Delete custom fields ⚠ | `POST /api/v1/custom-fields/delete` | `conversations:write` |
| Get a custom field | `GET /api/v1/custom-fields/{customField}` | `conversations:read` |
| Update a custom field | `PUT /api/v1/custom-fields/{customField}` | `conversations:write` |

</details>

<details><summary><strong>Webhooks</strong> (8)</summary>

| Operation | Route | Permission |
|---|---|---|
| List event types | `GET /api/v1/webhooks/events` | `accounts:read` |
| List webhook subscriptions ⚠ "return all" | `GET /api/v1/webhooks` | `webhooks:read` |
| Create a webhook subscription ⚠ | `POST /api/v1/webhooks` | `webhooks:write` |
| Get a webhook subscription ⚠ | `GET /api/v1/webhooks/{id}` | `webhooks:read` |
| Update a webhook subscription ⚠ | `PUT /api/v1/webhooks/{id}` | `webhooks:write` |
| Delete a webhook subscription ⚠ | `DELETE /api/v1/webhooks/{id}` | `webhooks:write` |
| List a subscription's deliveries ⚠ "return all" | `GET /api/v1/webhooks/{id}/deliveries` | `webhooks:read` |
| Send a test event ⚠ | `POST /api/v1/webhooks/{id}/test` | `webhooks:write` |

</details>

<details><summary><strong>Group Campaigns</strong> (12)</summary>

| Operation | Route | Permission |
|---|---|---|
| List campaigns "return all" | `GET /api/v1/campaigns` | `communities:read` |
| Get a campaign | `GET /api/v1/campaigns/{campaign}` | `communities:read` |
| List a campaign's conditions | `GET /api/v1/campaigns/{campaign}/conditionals` | `communities:read` |
| List the groups you can add to a campaign "return all" | `GET /api/v1/campaigns/{campaign}/available-groups` | `communities:read` |
| List a campaign's groups "return all" | `GET /api/v1/campaigns/{campaign}/groups` | `communities:read` |
| List a campaign's pipelines "return all" | `GET /api/v1/campaigns/{campaign}/pipelines` | `communities:read` |
| Get a pipeline | `GET /api/v1/campaigns/{campaign}/pipelines/{pipeline}` | `communities:read` |
| Get the limits of an operation plan | `GET /api/v1/campaigns/{campaign}/operation-plans/config` | `communities:read` |
| List a campaign's operation plans "return all" | `GET /api/v1/campaigns/{campaign}/operation-plans` | `communities:read` |
| Get an operation plan | `GET /api/v1/campaigns/{campaign}/operation-plans/{plan}` | `communities:read` |
| List a campaign's actions "return all" | `GET /api/v1/campaigns/{campaign}/actions` | `communities:read` |
| List an action's groups "return all" | `GET /api/v1/campaigns/{campaign}/actions/{action}/groups` | `communities:read` |

</details>

<details><summary><strong>Scheduled Sends</strong> (9)</summary>

| Operation | Route | Permission |
|---|---|---|
| List scheduled sends "return all" | `GET /api/v1/scheduled-messages` | `communities:read` |
| Get a scheduled send | `GET /api/v1/scheduled-messages/{scheduledMessage}` | `communities:read` |
| List a scheduled send's groups | `GET /api/v1/scheduled-messages/{scheduledMessage}/groups` | `communities:read` |
| Get a scheduled send's result by group "return all" | `GET /api/v1/scheduled-messages/{scheduledMessage}/group-messages` | `communities:read` |
| Get a scheduled send's reads and plays | `GET /api/v1/scheduled-messages/{scheduledMessage}/readed-played-rates` | `communities:read` |
| List a recurring send's runs "return all" | `GET /api/v1/scheduled-messages/{scheduledMessage}/runs` | `communities:read` |
| List scheduled send folders | `GET /api/v1/scheduled-messages/folders` | `communities:read` |
| List the answers to a scheduled send "return all" | `GET /api/v1/scheduled-messages/{scheduledMessage}/responses` | `communities:read` |
| List the tags a scheduled send gives to who answers | `GET /api/v1/scheduled-messages/{scheduledMessage}/response-tags` | `communities:read` |

</details>

<details><summary><strong>Group Statistics</strong> (6)</summary>

| Operation | Route | Permission |
|---|---|---|
| Get participants by period | `GET /api/v1/stats/participants` | `communities:read` |
| Get active participants | `GET /api/v1/stats/active-participants` | `communities:read` |
| Get your groups by status | `GET /api/v1/stats/groups` | `communities:read` |
| Get the clicks on your links | `GET /api/v1/stats/clicks` | `communities:read` |
| List the click records "return all" | `GET /api/v1/stats/records` | `communities:read` |
| Get the metrics by country | `GET /api/v1/stats/country-metrics` | `communities:read` |

</details>

<details><summary><strong>Broadcasts</strong> (16)</summary>

| Operation | Route | Permission |
|---|---|---|
| List broadcasts "return all" | `GET /api/v1/broadcasts` | `conversations:read` |
| Find the contacts for a broadcast | `POST /api/v1/broadcasts/contacts` | `conversations:write` |
| Count the contacts for a broadcast | `POST /api/v1/broadcasts/contacts-count` | `conversations:write` |
| Get the cost tiers | `GET /api/v1/broadcasts/cost-tiers` | `conversations:read` |
| Move broadcasts to a folder | `POST /api/v1/broadcasts/move-to-folder` | `conversations:write` |
| Get a broadcast | `GET /api/v1/broadcasts/{broadcast}` | `conversations:read` |
| Delete a broadcast ⚠ | `DELETE /api/v1/broadcasts/{broadcast}` | `conversations:write` |
| Get a broadcast's statistics | `GET /api/v1/broadcasts/{broadcast}/statistics` | `conversations:read` |
| Get a broadcast's cost | `GET /api/v1/broadcasts/{broadcast}/cost` | `conversations:read` |
| List a broadcast's contacts "return all" | `GET /api/v1/broadcasts/{broadcast}/contacts` | `conversations:read` |
| Cancel a broadcast | `POST /api/v1/broadcasts/{broadcast}/cancel` | `conversations:write` |
| List a broadcast's messages "return all" | `GET /api/v1/broadcasts/{broadcast}/messages` | `conversations:read` |
| List broadcast folders "return all" | `GET /api/v1/broadcasts/folders` | `conversations:read` |
| Create a broadcast folder | `POST /api/v1/broadcasts/folders` | `conversations:write` |
| Rename a broadcast folder | `PUT /api/v1/broadcasts/folders/{broadcastFolder}` | `conversations:write` |
| Delete a broadcast folder ⚠ | `DELETE /api/v1/broadcasts/folders/{broadcastFolder}` | `conversations:write` |

</details>

<details><summary><strong>Automations</strong> (11)</summary>

| Operation | Route | Permission |
|---|---|---|
| Pause a contact's automations | `POST /api/v1/contacts/{contact}/pause` | `conversations:write` |
| List a contact's flows "return all" | `GET /api/v1/contacts/{contact}/flows` | `conversations:read` |
| List a contact's flow runs "return all" | `GET /api/v1/contact-flows/{contactId}` | `conversations:read` |
| Cancel a flow run | `PUT /api/v1/contact-flows/{contactFlowId}/cancel` | `conversations:write` |
| List flows "return all" | `GET /api/v1/flows` | `conversations:read` |
| Get a flow | `GET /api/v1/flows/{flow}` | `conversations:read` |
| List a flow's nodes "return all" | `GET /api/v1/flows/{flow}/nodes` | `conversations:read` |
| Count a flow's running contacts | `GET /api/v1/flows/{flow}/active-contacts` | `conversations:read` |
| Count a flow's paused contacts | `GET /api/v1/flows/{flow}/paused-contacts` | `conversations:read` |
| List a flow's paused contacts "return all" | `GET /api/v1/flows/{flow}/paused-contacts-list` | `conversations:read` |
| List a flow's contacts "return all" | `GET /api/v1/flows/{flow}/flow-contacts` | `conversations:read` |

</details>

<details><summary><strong>Flow Folders</strong> (5)</summary>

| Operation | Route | Permission |
|---|---|---|
| List flow folders "return all" | `GET /api/v1/folders` | `conversations:read` |
| Create a flow folder | `POST /api/v1/folders` | `conversations:write` |
| Get a flow folder | `GET /api/v1/folders/{folder}` | `conversations:read` |
| Update a flow folder | `PUT /api/v1/folders/{folder}` | `conversations:write` |
| Delete a flow folder ⚠ | `DELETE /api/v1/folders/{folder}` | `conversations:write` |

</details>

<details><summary><strong>Boards</strong> (16)</summary>

| Operation | Route | Permission |
|---|---|---|
| List boards "return all" | `GET /api/v1/kanban-settings` | `conversations:read` |
| Create a board | `POST /api/v1/kanban-settings` | `conversations:write` |
| Get a board | `GET /api/v1/kanban-settings/{kanbanSetting}` | `conversations:read` |
| Update a board | `PUT /api/v1/kanban-settings/{kanbanSetting}` | `conversations:write` |
| Delete a board ⚠ | `DELETE /api/v1/kanban-settings/{kanbanSetting}` | `conversations:write` |
| Check which contacts are on a board | `GET /api/v1/kanban-settings/{kanbanSetting}/members` | `conversations:read` |
| Get a contact's stages "return all" | `GET /api/v1/contacts/{contact}/kanban-stages` | `conversations:read` |
| Move a contact to a stage | `POST /api/v1/kanban-settings/{kanbanSetting}/move-contact` | `conversations:write` |
| Move contacts to a stage | `POST /api/v1/kanban-settings/{kanbanSetting}/bulk-move` | `conversations:write` |
| Remove a contact from a board | `POST /api/v1/kanban-settings/{kanbanSetting}/remove-contact` | `conversations:write` |
| Remove contacts from a board | `POST /api/v1/kanban-settings/{kanbanSetting}/bulk-remove` | `conversations:write` |
| Create a stage | `POST /api/v1/kanban-settings/{kanbanSetting}/stages` | `conversations:write` |
| Reorder the stages | `POST /api/v1/kanban-settings/{kanbanSetting}/stages/reorder` | `conversations:write` |
| Rename a stage | `PUT /api/v1/kanban-settings/{kanbanSetting}/stages/{stage}` | `conversations:write` |
| Delete a stage ⚠ | `DELETE /api/v1/kanban-settings/{kanbanSetting}/stages/{stage}` | `conversations:write` |
| List a stage's contacts "return all" | `GET /api/v1/kanban-settings/{kanbanSetting}/stages/{stage}/contacts` | `conversations:read` |

</details>

<details><summary><strong>Tickets</strong> (7)</summary>

| Operation | Route | Permission |
|---|---|---|
| List tickets "return all" | `GET /api/v1/tickets` | `conversations:read` |
| Create a ticket | `POST /api/v1/tickets` | `conversations:write` |
| Get a ticket | `GET /api/v1/tickets/{id}` | `conversations:read` |
| Update a ticket | `PUT /api/v1/tickets/{id}` | `conversations:write` |
| Assign a ticket | `POST /api/v1/tickets/assign` | `conversations:write` |
| Close a ticket | `POST /api/v1/tickets/{id}/close` | `conversations:write` |
| Reopen a ticket | `POST /api/v1/tickets/{id}/reopen` | `conversations:write` |

</details>

<details><summary><strong>Quick Replies</strong> (5)</summary>

| Operation | Route | Permission |
|---|---|---|
| List quick replies "return all" | `GET /api/v1/quick-replies` | `conversations:read` |
| Create a quick reply | `POST /api/v1/quick-replies` | `conversations:write` |
| Get a quick reply | `GET /api/v1/quick-replies/{quickReply}` | `conversations:read` |
| Update a quick reply | `PUT /api/v1/quick-replies/{quickReply}` | `conversations:write` |
| Delete a quick reply ⚠ | `DELETE /api/v1/quick-replies/{quickReply}` | `conversations:write` |

</details>

<details><summary><strong>Lead Score</strong> (5)</summary>

| Operation | Route | Permission |
|---|---|---|
| Get a contact's lead score | `GET /api/v1/contacts/{contact}/lead-score` | `conversations:read` |
| Get the lead score distribution | `GET /api/v1/lead-score/distribution` | `conversations:read` |
| Get the lead score settings | `GET /api/v1/lead-score/settings` | `conversations:read` |
| Set the lead score settings | `PUT /api/v1/lead-score/settings` | `conversations:write` |
| Adjust a contact's lead score | `POST /api/v1/contacts/{contact}/lead-score/adjustments` | `conversations:write` |

</details>

<details><summary><strong>Sales</strong> (5)</summary>

| Operation | Route | Permission |
|---|---|---|
| List a payment platform's products "return all" | `GET /api/v1/payments/products/{platform}` | `conversations:read` |
| Get the sales metrics | `GET /api/v1/sales/metrics` | `conversations:read` |
| Get the sales funnel | `GET /api/v1/sales/funnel` | `conversations:read` |
| Get the sales by platform | `GET /api/v1/sales/by-platform` | `conversations:read` |
| List sales "return all" | `GET /api/v1/sales` | `conversations:read` |

</details>

<details><summary><strong>Account and Team</strong> (6)</summary>

| Operation | Route | Permission |
|---|---|---|
| Get your monthly active contacts usage | `GET /api/v1/mac/status` | `conversations:read` |
| List your monthly active contacts "return all" | `GET /api/v1/mac/contacts` | `conversations:read` |
| List the history of your monthly active contacts "return all" | `GET /api/v1/mac/contacts/history` | `conversations:read` |
| Get a team member | `GET /api/v1/agents/{user}` | `conversations:read` |
| List your team "return all" | `GET /api/v1/agents` | `conversations:read` |
| Get my account | `GET /api/v1/me` | `accounts:read` |

</details>

<details><summary><strong>Alerts</strong> (8)</summary>

| Operation | Route | Permission |
|---|---|---|
| List the campaigns for alerts "return all" | `GET /api/v1/alerts/campaigns` | `accounts:read` |
| List the alert types | `GET /api/v1/alerts/catalog` | `accounts:read` |
| Get the daily report settings | `GET /api/v1/alerts/daily-report` | `accounts:read` |
| Set the daily report | `PUT /api/v1/alerts/daily-report` | `accounts:write` |
| List alert destinations "return all" | `GET /api/v1/alerts/destinations` | `accounts:read` |
| Get the quiet hours | `GET /api/v1/alerts/quiet-hours` | `accounts:read` |
| Set the quiet hours | `PUT /api/v1/alerts/quiet-hours` | `accounts:write` |
| Turn an alert on or off | `PUT /api/v1/alerts/destinations/{id}/settings` | `accounts:write` |

</details>

<details><summary><strong>Custom Domains</strong> (5)</summary>

| Operation | Route | Permission |
|---|---|---|
| List custom domains "return all" | `GET /api/v1/custom-domains` | `accounts:read` |
| Add a custom domain | `POST /api/v1/custom-domains` | `accounts:write` |
| Verify a custom domain | `POST /api/v1/custom-domains/{customDomain}/verify` | `accounts:write` |
| Change how the certificate is validated | `POST /api/v1/custom-domains/{customDomain}/switch-validation` | `accounts:write` |
| Delete a custom domain ⚠ | `DELETE /api/v1/custom-domains/{customDomain}` | `accounts:operate` |

</details>

<!-- operations:end -->

### What 0.3.0 removed

0.3.0 (2026-11-11) generates the node only from what the portal publishes. These 26 operations of 0.2.x went out,
because the portal does not publish them: they are closed to API keys in production. A saved workflow that uses one
of them fails with "Unknown operation".

| Resource | Operation | Route |
|---|---|---|
| Conversations and Messages | Update a contact's conversation | `PUT /api/v1/contacts/{contact}/update` |
| Conversations and Messages | Send a poll | `POST /api/v1/contacts/{contact}/message/poll` |
| Conversations and Messages | Send an event invitation | `POST /api/v1/contacts/{contact}/message/event` |
| Templates | Get a template's quick reply buttons | `GET /api/v1/templates/{template}/quick-reply-buttons` |
| Groups | List the messages sent to a group | `GET /api/v1/groups/{group}/messages` |
| Groups | List a campaign's participants | `GET /api/v1/campaigns/{campaign}/participants` |
| Groups | List participants with their current group | `GET /api/v1/campaigns/{campaign}/campaign-participants` |
| Numbers | Get a number's WhatsApp profile | `GET /api/v1/devices/{device}/me` |
| Numbers | Check whether a phone has WhatsApp | `GET /api/v1/devices/{device}/check-phone` |
| Numbers | Set the received messages webhook | `PUT /api/v1/devices/{device}/update-webhook-received` |
| Numbers | Set the received and delivery webhook | `PUT /api/v1/devices/{device}/update-webhook-received-and-delivery` |
| Numbers | List a number's chats | `GET /api/v1/devices/{device}/chats` |
| Numbers | Check which phones have an open conversation | `GET /api/v1/devices/{device}/open-conversations` |
| Numbers | Get a token for the WhatsApp Web extension | `POST /api/v1/devices/{device}/extension-token` |
| Numbers | List a number's logs | `GET /api/v1/devices/{device}/logs` |
| Numbers | Get the logs health signal | `GET /api/v1/devices/{device}/logs/health` |
| Numbers | List the logs of all numbers | `GET /api/v1/devices/logs` |
| Numbers | Get the disconnection survey | `GET /api/v1/devices/{device}/disconnect-survey` |
| Numbers | Answer the disconnection survey | `POST /api/v1/devices/{device}/disconnect-survey` |
| Webhooks | List webhooks | `GET /api/v1/webhooks/endpoints` |
| Webhooks | Create a webhook | `POST /api/v1/webhooks/endpoints` |
| Webhooks | Get a webhook | `GET /api/v1/webhooks/endpoints/{id}` |
| Webhooks | Update a webhook | `PATCH /api/v1/webhooks/endpoints/{id}` |
| Webhooks | Delete a webhook | `DELETE /api/v1/webhooks/endpoints/{id}` |
| Webhooks | Choose a webhook's events | `PUT /api/v1/webhooks/endpoints/{id}/events` |
| Webhooks | List a webhook's deliveries | `GET /api/v1/webhooks/endpoints/{id}/deliveries` |

For webhooks, use the subscriptions (**Webhooks → Create a webhook subscription**, or the **Funnelchat Trigger**). The
default operation of **Templates** was "Get a template's quick reply buttons": it is now **List templates**. Two more
things changed for the operations that stayed: in "List forms" and "List a form's responses" the page size goes as
`perPage`, and **From** and **To** of the form responses and metrics go as date and time, as the specification says.

## The Funnelchat Trigger

### How it works

1. You choose the **Events** from the list. The list comes from Funnelchat's catalog (`GET /api/v1/webhooks/events`):
   it shows the types that can be subscribed to, the read permission each one needs, and marks the ones that are not
   emitted yet (`planned`). If the key cannot read the catalog (it needs `accounts:read`), it shows the list built into
   the node: every event type of the portal's published specification that a subscription takes (the count is in
   [Operations](#operations)), among them the six of the first use (`message.status_changed`, `message.received`,
   `device.connected`, `device.disconnected`, `group_participant.joined` and `group_participant.left`),
   `whatsapp_form.completed`, `contact.updated`, `group.message_received` and `group_action.completed`.

   Events go **by name**, always: Funnelchat does not take `*`, and `message.status_changed` (the busiest one) is
   never included by a wildcard. A list with `*`, or an empty one, stops the activation with an error before calling
   the API. From an expression, the events may come as a list or as text separated by commas.

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
- **Room in the workspace:** there is a cap of 50 subscriptions per workspace. The subscription belongs to the
  workspace of the key and receives only that workspace's events.

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
		"device_id": 4521,
		"workspace_id": 37
	}
}
```

Every event carries `data.workspace_id`: the workspace it belongs to, which is the one of your key (accounts
`v1.5.97`). Delivery is "at least once": the same event may arrive twice with the same `id`. If your workflow does not tolerate
duplicates, keep the processed `id`s and drop the ones you have already seen. The format of each type is in the
portal's event catalog.

In **Message received in a group** (`group.message_received`) and **Reaction in a group** (`group.reaction_added`) the
message is identified by `data.message.uid`, its ID on WhatsApp, as the portal's example shows. Use
`{{ $json.data.message.uid }}`.

### The signature

Header `X-Funnelchat-Signature: t=<unix>,v1=<hex>`. `v1` is the HMAC-SHA256, with the full secret of the subscription
(including its `whsec_`), of `"<t>." + raw body`. There may be several `v1` (one match is enough) and `t` cannot be more
than 300 seconds away from n8n's clock: keep the server's clock in sync. The code is the one of the portal's snippet
(`snippets/verificar-firma.js`) and the tests use its same vectors (`tests/test_firmas.py`).

## Workflow examples

### Receive a message and reply

1. **Funnelchat Trigger** — Events: "Message received (message.received)".
2. **If** (optional) — continue only if `{{ $json.data.message.type }}` is `text`.
3. **Funnelchat** — resource "Conversations and Messages", operation "Send a message":
   - Number ID: `{{ $json.data.device_id }}` (it may be `null`; then, the ID from "Numbers → List numbers").
   - Phone: `{{ $json.data.contact.phone }}` (with or without `+`).
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
   `docker run --rm -p 127.0.0.1:4010:4010 funnelchat-sandbox`. Its panel is at `http://localhost:4010/_sandbox`.
   The sandbox takes any key shaped like a real one: publish its port only on your machine (`127.0.0.1:`), not to
   your network.
2. **Create a Funnelchat API credential** for the sandbox:
   - **Environment**: **Custom**.
   - **Base URL**: `http://localhost:4010`. With an `fc_live_` key the node only takes `http://` to `localhost`,
     `127.0.0.1` or `[::1]`: if n8n runs in Docker, start the sandbox in the network of n8n's container
     (`docker run --rm --network container:<n8n's container> funnelchat-sandbox`) and keep `http://localhost:4010`.
   - **API Key**: `1|fc_live_sandbox`. The sandbox accepts any key shaped like a real one, and all of them have every
     permission.

   The credential test calls the sandbox's `GET /api/v1/me`.

3. **Actions.** Contacts, conversations and messages, tags, custom fields, templates, WhatsApp forms, numbers
   (connecting them by QR and with connect links too), groups (the number's live list, **Follow a group**, **Send a
   message to a group** and **Get a group action**) and webhook subscriptions keep what you do, in one or more
   workspaces; most of the rest answers an example built from the specification. Sending with an API key is open in
   the sandbox, with the API's 24-hour window and anti-spam guards, every response carries `X-Request-Id`, and every
   event carries `data.workspace_id` (sandbox `0.4.0`).
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

   Nothing scans a QR in the sandbox: after **Create a number to connect by QR**, `POST /_sandbox/devices/{id}/connect`
   connects it and sends `device.connected`. `POST /_sandbox/groups/participant-joined` (and `…/participant-left`), with
   `{"group": {"uid": "…@g.us", "name": "…"}, "participant": {"phone": "…"}}`, sends the group events.

5. **What the sandbox does not show you:** with the real API, n8n's URL has to be `https` and public (try it with
   `npx @funnelchat-hq/sandbox --require-https`).

The end-to-end tests (`npm run test:e2e`, see [Development](#development)) last passed on 2026-11-04, against the
sandbox `0.2.0` (`main` @ `b3b4513`): the first use of 0.2.0 (**Send a message** to a contact and the trigger up to `read`, with the
`client_reference`), a number created by QR, its QR and `device.connected` through the trigger, a connect link
created, read, listed by reference and revoked, the group participant events, sending and reading a message, file by
URL, `X-Request-Id` in errors, and a WhatsApp form created, published, sent and completed through the trigger. By
hand, on 2026-10-16 with n8n 2.25.7 and the sandbox @ `7a1b3d8`: the credential test, a workflow with "Create or update
a contact" and "List tags", and the full trigger cycle.

## Regenerating

The node's operations and the trigger's built-in event list are not written by hand: they come from the portal's
**published** specification (`https://developers-portal.funnelchat.app/specs/funnelchat.json`), and from nothing else.
When the portal publishes a new one:

1. Download it and run, from the repository:

   ```bash
   npm run generate -- --spec /path/to/funnelchat.json
   ```

   It copies the file to `spec/funnelchat.json` byte for byte, records it in `spec/PROVENANCE.md` (SHA-256,
   operations, event types, domains, categories and date, in the block between its markers) and generates
   `nodes/Funnelchat/generated/operations.ts`, `nodes/FunnelchatTrigger/generated/events.ts` and this README's
   operations table. Nothing else has to be touched for that.
2. Read what it prints. `warning:` is something of the config that does not match the specification any more (for
   example an operation pinned to a resource that went out). `to review:` is a text the node shows in a neutral way
   because it has no English yet (the route as the name of an operation, the type of an event, the portal's name of a
   new group) or a choice the generator made on its own. Neither stops the generation.
3. Review the diff and run `npm run lint`, `npm run build` and `npm test`. Add a short note to `spec/PROVENANCE.md` if
   the copy needs one (who handed it over, what changed).

`npm run generate` without `--spec` generates again from the copy already in `spec/` (for example after changing
`scripts/`); it refuses to run if `spec/PROVENANCE.md` does not record the copy's SHA-256.

What changes on its own: new operations, permissions, fields, pagination, event types, groups and categories. A new
group of the portal that no resource lists gets a resource of its own, so nothing is left out. What is set in
`scripts/`:

- **English texts.** The specification is in Spanish. The name and purpose of each operation are in
  `scripts/operations.en.json` (by `operationId`, or by `METHOD /path` for one without it), and the label of each event
  type in `scripts/events.en.json`. One without them still goes into the node, with its route as its name (an event,
  with its type) and appears under `to review:`. Six alert operations the portal does not publish yet (creating,
  updating and deleting a destination, its verification code and its webhook test) are already translated.
- **`scripts/generator.config.json`.** Which groups of the portal go into each resource (`resources`, with the English
  name of each one; one with `optional: true` may not be in the specification yet); the English names of the
  categories (`categories.names`, by their `id` or their title; the specification gives them in `x-tagGroups`, as
  `x-fc-categoria` of each group, any property whose name says "categor", or groups named after the category, and
  their order, title and link in `x-fc-categorias` at its root; another `x-…` property of the groups is listed under
  `to review:`); the English labels of the fields (the ones not listed
  show their API name) and their English descriptions (`fieldDescriptionsByName`; a description of the specification
  in Spanish is not shown); in `operationNotes`, notices of what a domain's code requires and its specification does
  not say; and what keeps saved workflows working when the specification changes what the node published:
  `defaultResource` and each `defaultOperation`, `operationResources` (an operation the portal moves to another group
  stays in its resource), `keepOperationValues` (a renamed operation keeps its old value), `keepFieldKinds` (a field
  keeps its kind), `fieldDefaults` (the option shown first) and `extraParameters` (query fields the code reads and the
  specification does not list).
- **Only what the portal publishes.** There are no supplements any more: a route the portal does not publish is not
  in the node, even if a domain has it.
- **An operation that goes out.** The value of each operation in n8n is its `operationId`, and saved workflows keep
  it. `test/fixtures/published-operations.json` lists every operation the node has published; the tests check each one
  is still there, in its resource, unless it is in `removed` with the version that took it out. If the specification
  renames one, add it to `keepOperationValues` (it happened with "Get a message": `message.showMessage` in the
  specification, `showMessage` in the node).
- **Compare before and after.** For the operations the node already had, look in the diff of
  `generated/operations.ts` for a field that disappears, changes its `name` or kind, or becomes required: a saved
  workflow could lose its value.

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

**Checks:** every pull request and every push to `main` run `.github/workflows/ci.yml`: install, the generated files
up to date, lint, build and tests on the current Node.js LTS, and the tests on Node.js 20.15, the minimum of
`engines`, installing with `npm ci --ignore-scripts` (`isolated-vm`, a native development dependency that needs
Node.js 24, does not build there, and the tests do not load it). The build and the lint need Node.js 20.19 or 22.12
(`@n8n/node-cli`).

**Publishing:** a `vX.Y.Z` tag on a commit of `main`, matching the `package.json` version; GitHub Actions
(`.github/workflows/publish.yml`) runs the tests and publishes it through npm Trusted Publishing. A tag on a commit
that is not in `main` fails before publishing. A pre-release (`vX.Y.Z-rc.N`, `vX.Y.Z-beta.N`) goes out with the npm
tag `next`, never as the default version.

- `nodes/Funnelchat/`: the action node. `generated/operations.ts` is the generated table; `description.ts` builds the
  fields from it and `request.ts` builds the requests (route, query and body) and the pagination.
- `nodes/FunnelchatTrigger/`: the trigger. `generated/events.ts` is the built-in event list.
- `nodes/shared/`: the transport (key, base URL, errors, `429`) and the signature check.
- `test/`: the generation (from the specification in `spec/`, and from a small one of its own for the categories,
  `--spec` and the texts without English), the signature with the portal's vectors, building requests and pagination,
  the trigger's create, check and delete cycle, and the custom base URL.
- `test/e2e/`: the node with real HTTP against the sandbox: the first use, connecting a number by QR and with a
  connect link, the group participant events, send and read a message, file by URL, `X-Request-Id` in errors, the
  trigger cycle with a really signed event, and a WhatsApp form end to end. Without `FUNNELCHAT_SANDBOX_URL` it is
  skipped.

## Sources and what is left to verify

| What | Where it comes from | Status on 2026-11-13 |
| --- | --- | --- |
| Every operation and the trigger's built-in event list | The specification published at `https://developers-portal.funnelchat.app/specs/funnelchat.json` (portal `v0.6.16`, SHA-256 `7db2ead826697c80fd8feef3f0ea556b5374dd3d2cb5e02f3cfe4584af79e33c`): 253 operations, 56 event types, 30 groups in three categories | The portal's `v0.6.16` |
| `data.message.uid` in `group.message_received` and `group.reaction_added` | The portal's example (since `v0.6.14`) | Published |
| The page size of "List forms" and "List a form's responses" | The specification: `perPage` | The conversations code read `per_page` in `v1.18.10` (the supplement the node had until 0.2.3); not checked against the code in production |
| The signature algorithm and vectors, the event envelope | developers-portal (`snippets/verificar-firma.js`, `tests/test_firmas.py`) | Published |
| The local sandbox of "Testing with the sandbox" | funnelchat-sandbox `0.4.0` (`@funnelchat-hq/sandbox` on npm, 2026-11-12) | Groups, the send to a group and its action, workspaces and `data.workspace_id`; the end-to-end tests last ran against `0.2.0` |

The details of each source are in [`spec/PROVENANCE.md`](spec/PROVENANCE.md).
