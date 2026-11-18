# Changelog

## 0.5.0

- **Generated from the portal's spec at `fe4df8d`** (`v0.7.0-35-gfe4df8d`, sha256 `4a8fbaee…`). The same 253
  operations, with the same values: saved workflows keep working, and "Get my account" keeps `get_api_v1_me`.
  - Every operation says now whether it can be undone (`x-fc-destructive`). Four more ask the AI agent for
    confirmation (⚠ "Irreversible"): cancelling a broadcast or a flow run, removing participants from a group and
    renewing its invite link. The node already asked for every deletion, also those sent by `POST`.
  - The third category is "Platform functions" («Funciones de la plataforma» in the portal).
  - Dates the spec gives as `format: date` go as `YYYY-MM-DD` (for example `dateFrom` and `dateTo` of "List a
    stage's contacts").
  - `event_type` and `event_id` of "List a subscription's deliveries" come from the spec.
- **The credential no longer offers Staging.** It shares the data and the numbers of production, so it was never a
  place to test: use **Custom** with the local sandbox. A credential saved with Staging fails its test and the node
  stops before sending anything, saying to choose Production or Custom.
- **README:** how to set up the credential, and that the node works in self-hosted n8n; in n8n Cloud, only once n8n
  verifies it.
- The end-to-end tests run against the sandbox 0.7.0 (9 of 9).

## 0.4.0

Opaque IDs (portal v0.7.0): every ID is text with a prefix by type. See "Migrating to 0.4.0" in the README.
