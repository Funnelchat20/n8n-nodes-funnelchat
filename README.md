# n8n-nodes-funnelchat

Nodo comunitario de [n8n](https://n8n.io) para la API pública de Funnelchat. Con él armás flujos que trabajan con tu
cuenta sin escribir código: sincronizar contactos desde un formulario o un CRM, responder mensajes, revisar el estado de
tus números o reaccionar a lo que pasa en tu cuenta.

Trae tres piezas:

- **Credencial «Funnelchat API»**: tu clave de API y el entorno (producción, staging o una URL propia, como el sandbox).
- **Nodo «Funnelchat»**: las operaciones de la API agrupadas como en el portal: contactos, conversaciones y mensajes,
  plantillas, formularios de WhatsApp, etiquetas, campos personalizados, grupos, números y webhooks. Se generan de la
  especificación unificada y de lo que los dominios abrieron después.
- **Nodo «Funnelchat Trigger»**: arranca un flujo con cada evento que Funnelchat manda por webhook, con la firma
  verificada.

> [!IMPORTANT]
> **Estado: 0.1.0, listo para publicar y todavía sin publicar** en npm ni en el registro de nodos de n8n. Está al día
> con la API que corre en production el 22-10-2026 (accounts `v1.4.24`, conversations `v1.18.10`). La API pública es
> v0 y puede cambiar: ver [Fuentes y lo que falta verificar](#fuentes-y-lo-que-falta-verificar).

Documentación de la API: [portal de desarrolladores de Funnelchat](https://developers-portal.funnelchat.app/docs/).

## Contenido

- [Instalación](#instalación)
- [Ejemplo mínimo](#ejemplo-mínimo)
- [Credencial](#credencial)
- [Nodo «Funnelchat»](#nodo-funnelchat)
- [Disparador «Funnelchat Trigger»](#disparador-funnelchat-trigger)
- [Ejemplos de flujos](#ejemplos-de-flujos)
- [Probar con el sandbox](#probar-con-el-sandbox)
- [Cómo regenerar](#cómo-regenerar)
- [Desarrollo](#desarrollo)
- [Fuentes y lo que falta verificar](#fuentes-y-lo-que-falta-verificar)

## Instalación

### Desde n8n (nodos comunitarios)

En n8n self-hosted: **Settings → Community nodes → Install** y escribí `n8n-nodes-funnelchat`. n8n lo baja del registro
público de npm y lo deja disponible en el panel de nodos: buscá «Funnelchat».

En n8n Cloud solo aparecen los nodos que n8n verificó. El paquete está preparado para eso (modo estricto, sin
dependencias en tiempo de ejecución, lint de n8n en verde), pero todavía no se envió a verificar.

### Con npm, en la carpeta de nodos de n8n

```bash
mkdir -p ~/.n8n/nodes && cd ~/.n8n/nodes
npm init -y                       # solo la primera vez
npm install n8n-nodes-funnelchat
```

Reiniciá n8n. Con Docker, esa carpeta es `/home/node/.n8n/nodes` dentro del volumen de n8n. Se probó con n8n 2.25.7
(imagen `n8nio/n8n`).

### Desde el código

```bash
git clone https://github.com/Funnelchat20/n8n-nodes-funnelchat.git
cd n8n-nodes-funnelchat
npm ci
npm run build
npm pack            # genera n8n-nodes-funnelchat-0.1.0.tgz
```

Y en la carpeta de nodos de n8n, `npm install /ruta/a/n8n-nodes-funnelchat-0.1.0.tgz`.

## Ejemplo mínimo

Un flujo que le manda un mensaje a un contacto y guarda el id del mensaje:

1. Creá la credencial **Funnelchat API** con tu clave (ver [Credencial](#credencial)).
2. Agregá el nodo **Funnelchat** — Recurso «Conversaciones y mensajes», operación «Enviar un mensaje a un contacto»:
   - ID del contacto (en la ruta y en el cuerpo): `2001`
   - ID del número: el id del número que envía, de «Números → Listar números».
   - Campos adicionales → Teléfono: el del contacto, `5491100000000`; Texto: `Hola`; Referencia propia: `pedido-981`.
3. Ejecutalo. Sale un ítem con el mensaje en cola:

```json
{
  "id": 1001,
  "contact_id": 2001,
  "device_id": 7,
  "direction": "outbound",
  "type": "text",
  "status": "queued",
  "error": null,
  "client_reference": "pedido-981",
  "created_at": "2026-10-22T13:05:00Z",
  "updated_at": "2026-10-22T13:05:00Z"
}
```

El resultado (`sent`, `delivered`, `read` o `failed`) llega después: con el **Funnelchat Trigger** y el evento
`message.status_changed`, que trae tu `client_reference`, o leyendo el mensaje con «Ver un mensaje».

## Credencial

1. En Funnelchat, entrá a la pantalla **Desarrolladores** y creá una clave con los permisos que vas a usar. La clave se
   muestra una sola vez y tiene la forma `<id>|fc_live_…`.
2. En n8n, creá una credencial **Funnelchat API**:
   - **Clave de API**: la clave completa, incluido el `<id>|` del principio. Se manda como
     `Authorization: Bearer <clave>`.
   - **Entorno**: **Producción** (`https://api.funnelchat.com`), **Staging** (`https://api-staging.funnelchat.com`) o
     **Personalizado**, con una **URL base** propia: por ejemplo el sandbox local, `http://localhost:4010` (ver
     [Probar con el sandbox](#probar-con-el-sandbox)). La URL base empieza con `http://` o `https://`, no termina en `/` y
     no lleva `/api/v1`: el nodo lo agrega. Si no cumple eso, la prueba de la credencial falla y el nodo no manda nada.
3. Al guardar, n8n prueba la credencial con `GET /api/v1/me` («Ver mi cuenta»). **Esa prueba pide el permiso
   `accounts:read`**: si tu clave no lo tiene, la prueba falla aunque la clave sirva para lo demás. Podés guardarla igual.

Cada operación del nodo dice qué permiso pide (`conversations:read`, `conversations:write`, `conversations:send`,
`communities:read`, `accounts:read`, `accounts:write`, `accounts:operate`, `webhooks:read` o `webhooks:write`). Si falta, la API responde
`403 permission_denied` y el nodo muestra el `message`, que dice cuál falta. Todas las claves son `fc_live_`: lo que hace
el nodo actúa sobre datos y números reales.

## Nodo «Funnelchat»

Elegís un **recurso** y una **operación**. Los nombres son los del portal, y cada operación muestra en su descripción
para qué sirve y qué permiso pide.

- **Campos.** Arriba van los obligatorios (por ejemplo, «ID del contacto»). Los opcionales se agregan desde **Filtros**
  (en las consultas) o **Campos adicionales** (en el cuerpo). Las listas se escriben separadas por comas o llegan como
  lista desde una expresión. Los campos con estructura (objetos, listas de objetos) se escriben en JSON.
- **Cuerpo en JSON.** En las operaciones que mandan un cuerpo, **Enviar el cuerpo como JSON** te deja escribirlo
  completo, tal como lo describe la referencia del portal. Sirve para mandar `null` o estructuras complejas.
- **Listados.** Los listados paginados tienen **Devolver todo**: si está apagado, trae hasta el **Límite**. El nodo pide
  las páginas solo (por número de página o por cursor, según la ruta) y devuelve un ítem por elemento.
- **Respuestas.** Un objeto sale como un ítem; una respuesta sin cuerpo (`204`, `202`) sale como
  `{ "success": true }`.
- **Envíos.** Con una clave, un envío (mensaje, plantilla, tarjeta de contacto, formulario) responde `200` con el
  **mensaje en cola** (`status: "queued"`) y su `id`, y el nodo devuelve ese mensaje como ítem (uno por mensaje en la
  tarjeta de contacto; uno por destino en el reenvío). **Referencia propia** (`client_reference`, hasta 64 caracteres
  ASCII sin espacios) vuelve en el mensaje y en `message.status_changed`. Antes de salir, cada envío pasa las guardas de
  WhatsApp: ventana de 24 horas (`422 window_closed`, salvo plantillas), ritmo (`429 rate_limited`), antibloqueo
  (`422 antiblock_duplicate_content`, `antiblock_unanswered_limit`) y contactos activos del mes
  (`429 mac_lockout_24h`, `mac_limit_reached`).
- **Archivo por URL.** En «Enviar un mensaje a un contacto» y «Enviar un mensaje», **Archivo** acepta una URL, también
  firmada o sin extensión: en ese caso indicá **Tipo de archivo** (`image`, `video`, `audio`, `document` o `sticker`)
  y, para un documento, **Nombre del archivo**. Si falta, la API responde `422` en `file_type` o `file_name`; una
  extensión que WhatsApp no admite, `415`.
- **Errores.** El error del nodo lleva el `message` de la API y, en la descripción, su `error` (código estable) y el
  **`X-Request-Id`** de la respuesta: citalo si consultás a soporte. Un `422` lista los campos con problemas. Un `429`
  con `Retry-After` de hasta 60 segundos se reintenta solo, hasta 3 veces; si la espera es más larga, el error dice
  cuánto esperar. La entrada de la API tiene errores propios: `404 route_not_found`, `502 origin_unreachable` y
  `500 edge_misconfigured`. **Un `502` en una escritura se trata como un timeout**: puede haberse aplicado, así que
  leé el estado antes de repetirla (no actives **Retry On Fail** en envíos). Con **Continue On Fail**, el ítem sale
  como `{ "error": "<código>", "message": "<texto>", "httpCode": "<estado>", "requestId": "<X-Request-Id>" }`.
- **Avisos (⚠).** Algunas operaciones muestran un aviso arriba de los campos: lo que el código de la API exige y la
  especificación no dice, que una ruta todavía no está abierta a claves o que la operación es irreversible.

El nodo también se puede usar como herramienta de un agente de IA de n8n.

### Operaciones

<!-- operaciones:inicio (generado por npm run generate) -->

128 operaciones generadas de la especificación (sha256 `8bbbae569b4c`) y sus suplementos. Las marcadas con ⚠ tienen un aviso en el nodo (lo que el código exige y la especificación no dice, una ruta cerrada a claves u operación irreversible).

<details><summary><strong>Contactos</strong> (15)</summary>

| Operación | Ruta | Permiso |
|---|---|---|
| Listar contactos «devolver todo» | `GET /api/v1/contacts` | `conversations:read` |
| Crear un contacto | `POST /api/v1/contacts` | `conversations:write` |
| Crear o actualizar un contacto | `POST /api/v1/contacts/update-or-create` | `conversations:write` |
| Asignar un campo personalizado a contactos | `POST /api/v1/contacts/attach-custom-field` | `conversations:write` |
| Quitar un campo personalizado de contactos | `POST /api/v1/contacts/detach-custom-field` | `conversations:write` |
| Ver un contacto | `GET /api/v1/contacts/{contact}` | `conversations:read` |
| Actualizar un contacto | `PUT /api/v1/contacts/{contact}` | `conversations:write` |
| Listar las etiquetas de un contacto «devolver todo» | `GET /api/v1/contacts/{contact}/tags` | `conversations:read` |
| Listar los campos personalizados de un contacto «devolver todo» | `GET /api/v1/contacts/{contact}/custom-fields` | `conversations:read` |
| Ver la ventana de 24 horas de un contacto | `GET /api/v1/contacts/{contact}/meta-window` | `conversations:read` |
| Listar los contactos de un número «devolver todo» | `GET /api/v1/devices/{device}/contacts` | `conversations:read` |
| Eliminar contactos | `POST /api/v1/contacts/delete` | `conversations:write` |
| Listar las notas de un contacto «devolver todo» | `GET /api/v1/contacts/{contact}/notes` | `conversations:read` |
| Agregar una nota a un contacto | `POST /api/v1/contacts/{contact}/notes` | `conversations:write` |
| Eliminar una nota | `DELETE /api/v1/contacts/{contact}/notes/{note}` | `conversations:write` |

</details>

<details><summary><strong>Conversaciones y mensajes</strong> (18)</summary>

| Operación | Ruta | Permiso |
|---|---|---|
| Listar conversaciones «devolver todo» | `GET /api/v1/conversations` | `conversations:read` |
| Contar conversaciones sin leer | `GET /api/v1/conversations/count/unread` | `conversations:read` |
| Contar conversaciones abiertas | `GET /api/v1/conversations/count/open` | `conversations:read` |
| Contar conversaciones cerradas | `GET /api/v1/conversations/count/closed` | `conversations:read` |
| Contar todas las conversaciones | `GET /api/v1/conversations/count/all` | `conversations:read` |
| Marcar todas como leídas | `POST /api/v1/conversations/mark-all-read` | `conversations:write` |
| Marcar todas como no leídas | `POST /api/v1/conversations/mark-all-unread` | `conversations:write` |
| Actualizar la conversación de un contacto | `PUT /api/v1/contacts/{contact}/update` | `conversations:write` |
| Enviar un mensaje a un contacto ⚠ | `POST /api/v1/contacts/{contact}/message` | `conversations:send` |
| Listar los mensajes de un contacto «devolver todo» | `GET /api/v1/contacts/{contactId}/messages` | `conversations:read` |
| Enviar un mensaje ⚠ | `POST /api/v1/message/send-message` | `conversations:send` |
| Ver un mensaje | `GET /api/v1/contacts/{contact}/messages/{message}` | `conversations:read` |
| Reaccionar a un mensaje ⚠ | `PUT /api/v1/contacts/{contact}/messages/{message}/reaction` | `conversations:send` |
| Quitar una reacción ⚠ | `DELETE /api/v1/contacts/{contact}/messages/{message}/reaction` | `conversations:send` |
| Reenviar un mensaje ⚠ | `POST /api/v1/contacts/{contact}/messages/{message}/forward` | `conversations:send` |
| Enviar una encuesta ⚠ | `POST /api/v1/contacts/{contact}/message/poll` | `conversations:send` |
| Enviar una invitación a un evento ⚠ | `POST /api/v1/contacts/{contact}/message/event` | `conversations:send` |
| Enviar una tarjeta de contacto ⚠ | `POST /api/v1/contacts/{contact}/message/contact-card` | `conversations:send` |

</details>

<details><summary><strong>Plantillas</strong> (7)</summary>

| Operación | Ruta | Permiso |
|---|---|---|
| Listar plantillas «devolver todo» | `GET /api/v1/templates` | `conversations:read` |
| Crear una plantilla | `POST /api/v1/templates` | `conversations:write` |
| Ver una plantilla | `GET /api/v1/templates/{template}` | `conversations:read` |
| Actualizar una plantilla | `PUT /api/v1/templates/{template}` | `conversations:write` |
| Ver los botones de respuesta rápida de una plantilla | `GET /api/v1/templates/{template}/quick-reply-buttons` | `conversations:read` |
| Enviar una plantilla ⚠ | `POST /api/v1/devices/{device}/templates/{template}/send-template` | `conversations:send` |
| Eliminar una plantilla de un número | `DELETE /api/v1/devices/{device}/templates/{template}` | `conversations:write` |

</details>

<details><summary><strong>Formularios de WhatsApp</strong> (19)</summary>

| Operación | Ruta | Permiso |
|---|---|---|
| Listar formularios «devolver todo» | `GET /api/v1/forms` | `conversations:read` |
| Crear un formulario | `POST /api/v1/forms` | `conversations:write` |
| Listar plantillas de formulario | `GET /api/v1/forms/templates` | `conversations:read` |
| Ver un formulario | `GET /api/v1/forms/{id}` | `conversations:read` |
| Guardar un formulario | `PUT /api/v1/forms/{id}` | `conversations:write` |
| Eliminar un borrador de formulario | `DELETE /api/v1/forms/{id}` | `conversations:write` |
| Ver los números de un formulario | `GET /api/v1/forms/{id}/numbers` | `conversations:read` |
| Agregar un número a un formulario | `POST /api/v1/forms/{id}/numbers` | `conversations:write` |
| Quitar un número de un formulario | `DELETE /api/v1/forms/{id}/numbers/{deviceId}` | `conversations:write` |
| Reintentar la publicación en los números | `POST /api/v1/forms/{id}/numbers/retry` | `conversations:write` |
| Crear una versión nueva de un formulario | `POST /api/v1/forms/{id}/versions` | `conversations:write` |
| Validar un formulario en Meta | `POST /api/v1/forms/{id}/sync` | `conversations:write` |
| Publicar un formulario | `POST /api/v1/forms/{id}/publish` | `conversations:write` |
| Ver la definición publicada de un formulario | `GET /api/v1/forms/families/{familyId}/definition` | `conversations:read` |
| Listar las versiones de un formulario «devolver todo» | `GET /api/v1/forms/families/{familyId}/versions` | `conversations:read` |
| Listar las respuestas de un formulario «devolver todo» | `GET /api/v1/forms/families/{familyId}/responses` | `conversations:read` |
| Ver una respuesta de un formulario | `GET /api/v1/forms/families/{familyId}/responses/{runId}` | `conversations:read` |
| Ver las métricas de un formulario | `GET /api/v1/forms/families/{familyId}/metrics` | `conversations:read` |
| Enviar un formulario a un contacto ⚠ | `POST /api/v1/contacts/{contact}/message/form` | `conversations:send` |

</details>

<details><summary><strong>Etiquetas</strong> (6)</summary>

| Operación | Ruta | Permiso |
|---|---|---|
| Listar etiquetas «devolver todo» | `GET /api/v1/tags` | `conversations:read` |
| Crear una etiqueta | `POST /api/v1/tags` | `conversations:write` |
| Ver una etiqueta | `GET /api/v1/tags/{tag}` | `conversations:read` |
| Actualizar una etiqueta | `PUT /api/v1/tags/{tag}` | `conversations:write` |
| Listar los contactos con una etiqueta «devolver todo» | `GET /api/v1/tags/{tag}/contacts` | `conversations:read` |
| Eliminar etiquetas | `POST /api/v1/tags/delete` | `conversations:write` |

</details>

<details><summary><strong>Campos personalizados</strong> (5)</summary>

| Operación | Ruta | Permiso |
|---|---|---|
| Listar campos personalizados «devolver todo» | `GET /api/v1/custom-fields` | `conversations:read` |
| Crear un campo personalizado | `POST /api/v1/custom-fields` | `conversations:write` |
| Eliminar campos personalizados | `POST /api/v1/custom-fields/delete` | `conversations:write` |
| Ver un campo personalizado | `GET /api/v1/custom-fields/{customField}` | `conversations:read` |
| Actualizar un campo personalizado | `PUT /api/v1/custom-fields/{customField}` | `conversations:write` |

</details>

<details><summary><strong>Grupos</strong> (14)</summary>

| Operación | Ruta | Permiso |
|---|---|---|
| Listar grupos «devolver todo» | `GET /api/v1/groups` | `communities:read` |
| Listar los grupos que administra un número «devolver todo» | `GET /api/v1/devices/{device}/groups` | `communities:read` |
| Listar los grupos de anuncios de un número «devolver todo» | `GET /api/v1/devices/{device}/ad-groups` | `communities:read` |
| Listar los canales de un número «devolver todo» | `GET /api/v1/devices/{device}/channels` | `communities:read` |
| Ver los datos actuales de un grupo en WhatsApp | `GET /api/v1/groups/{groupUid}/metadata` | `communities:read` |
| Ver un grupo | `GET /api/v1/groups/{group}` | `communities:read` |
| Listar las acciones de sesión sobre un grupo «devolver todo» | `GET /api/v1/groups/{group}/actions` | `communities:read` |
| Listar los mensajes enviados a un grupo «devolver todo» | `GET /api/v1/groups/{group}/messages` | `communities:read` |
| Listar los envíos programados que incluyen un grupo «devolver todo» | `GET /api/v1/groups/{group}/scheduled-messages` | `communities:read` |
| Listar los participantes de una campaña «devolver todo» | `GET /api/v1/campaigns/{campaign}/participants` | `communities:read` |
| Listar los participantes con su grupo actual «devolver todo» | `GET /api/v1/campaigns/{campaign}/campaign-participants` | `communities:read` |
| Listar entradas y salidas de una campaña «devolver todo» | `GET /api/v1/campaigns/{campaign}/participant-events` | `communities:read` |
| Listar los participantes de un grupo «devolver todo» | `GET /api/v1/groups/participants` | `communities:read` |
| Listar entradas y salidas de un grupo «devolver todo» | `GET /api/v1/groups/{group}/participant-events` | `communities:read` |

</details>

<details><summary><strong>Números</strong> (29)</summary>

| Operación | Ruta | Permiso |
|---|---|---|
| Listar números «devolver todo» | `GET /api/v1/devices` | `accounts:read` |
| Ver el perfil de WhatsApp de un número | `GET /api/v1/devices/{device}/me` | `accounts:read` |
| Verificar si un teléfono tiene WhatsApp | `GET /api/v1/devices/{device}/check-phone` | `accounts:read` |
| Ver un número | `GET /api/v1/devices/{device}` | `accounts:read` |
| Actualizar un número | `PUT /api/v1/devices/{device}` | `accounts:write` |
| Eliminar un número ⚠ | `DELETE /api/v1/devices/{device}` | `accounts:operate` |
| Reiniciar la sesión de un número ⚠ | `PUT /api/v1/devices/{device}/reset` | `accounts:operate` |
| Configurar el webhook de mensajes recibidos | `PUT /api/v1/devices/{device}/update-webhook-received` | `accounts:write` |
| Configurar el webhook de recibidos y entregas | `PUT /api/v1/devices/{device}/update-webhook-received-and-delivery` | `accounts:write` |
| Limpiar un número ⚠ | `POST /api/v1/devices/{device}/clean` | `accounts:operate` |
| Listar los chats de un número | `GET /api/v1/devices/{device}/chats` | `accounts:read` |
| Ver qué teléfonos tienen conversación abierta | `GET /api/v1/devices/{device}/open-conversations` | `accounts:read` |
| Ver la cola de mensajes | `GET /api/v1/devices/{device}/message-queue` | `accounts:read` |
| Eliminar mensajes de la cola | `DELETE /api/v1/devices/{device}/message-queue` | `accounts:write` |
| Contar los mensajes en la cola | `GET /api/v1/devices/{device}/message-queue/count` | `accounts:read` |
| Vaciar la cola de mensajes ⚠ | `DELETE /api/v1/devices/{device}/message-queue/all` | `accounts:operate` |
| Ver el estado de conexión | `GET /api/v1/devices/{device}/status` | `accounts:read` |
| Pedir un token para la extensión de WhatsApp Web | `POST /api/v1/devices/{device}/extension-token` | `accounts:write` |
| Ver la salud de un número | `GET /api/v1/devices/{device}/health` | `accounts:read` |
| Actualizar la salud de un número | `POST /api/v1/devices/{device}/health/refresh` | `accounts:write` |
| Ver el historial de conexión «devolver todo» | `GET /api/v1/devices/{device}/connection-history` | `accounts:read` |
| Listar los registros de un número «devolver todo» | `GET /api/v1/devices/{device}/logs` | `accounts:read` |
| Ver la señal de salud de los registros | `GET /api/v1/devices/{device}/logs/health` | `accounts:read` |
| Listar los registros de todos los números «devolver todo» | `GET /api/v1/devices/logs` | `accounts:read` |
| Ver el nombre de usuario | `GET /api/v1/devices/{device}/username` | `accounts:read` |
| Configurar el nombre de usuario | `POST /api/v1/devices/{device}/username` | `accounts:write` |
| Sugerir nombres de usuario | `GET /api/v1/devices/{device}/username/suggestions` | `accounts:read` |
| Ver la encuesta de desconexión | `GET /api/v1/devices/{device}/disconnect-survey` | `accounts:read` |
| Responder la encuesta de desconexión | `POST /api/v1/devices/{device}/disconnect-survey` | `accounts:write` |

</details>

<details><summary><strong>Webhooks</strong> (15)</summary>

| Operación | Ruta | Permiso |
|---|---|---|
| Listar suscripciones de webhooks ⚠ | `GET /api/v1/webhooks` | `webhooks:read` |
| Crear una suscripción de webhook ⚠ | `POST /api/v1/webhooks` | `webhooks:write` |
| Ver una suscripción de webhook ⚠ | `GET /api/v1/webhooks/{id}` | `webhooks:read` |
| Actualizar una suscripción de webhook ⚠ | `PUT /api/v1/webhooks/{id}` | `webhooks:write` |
| Eliminar una suscripción de webhook ⚠ | `DELETE /api/v1/webhooks/{id}` | `webhooks:write` |
| Listar las entregas de una suscripción ⚠ «devolver todo» | `GET /api/v1/webhooks/{id}/deliveries` | `webhooks:read` |
| Enviar un evento de prueba ⚠ | `POST /api/v1/webhooks/{id}/test` | `webhooks:write` |
| Listar tipos de evento | `GET /api/v1/webhooks/events` | `accounts:read` |
| Listar webhooks «devolver todo» | `GET /api/v1/webhooks/endpoints` | `accounts:read` |
| Crear un webhook | `POST /api/v1/webhooks/endpoints` | `accounts:write` |
| Ver un webhook | `GET /api/v1/webhooks/endpoints/{id}` | `accounts:read` |
| Actualizar un webhook | `PATCH /api/v1/webhooks/endpoints/{id}` | `accounts:write` |
| Eliminar un webhook | `DELETE /api/v1/webhooks/endpoints/{id}` | `accounts:write` |
| Elegir los eventos de un webhook | `PUT /api/v1/webhooks/endpoints/{id}/events` | `accounts:write` |
| Listar entregas de un webhook «devolver todo» | `GET /api/v1/webhooks/endpoints/{id}/deliveries` | `accounts:read` |

</details>

<!-- operaciones:fin -->

## Disparador «Funnelchat Trigger»

### Cómo funciona

1. Elegís los **Eventos** de la lista. La lista sale del catálogo de Funnelchat (`GET /api/v1/webhooks/events`): muestra
   los tipos que se pueden suscribir, el permiso de lectura que pide cada uno y marca los que todavía no se emiten
   (`planned`). Si la clave no puede leer el catálogo (pide `accounts:read`), muestra la lista que trae el nodo, copiada
   del catálogo de accounts `v1.4.24`: 53 tipos, entre ellos `message.received`, `message.status_changed`,
   `whatsapp_form.completed`, `group.message_received`, `group_action.completed` y `group.reaction_added`.
2. Al **activar** el flujo, el nodo crea una suscripción en Funnelchat (`POST /api/v1/webhooks`) con la URL de n8n,
   esos eventos y la descripción `n8n · <nombre del flujo>`, y guarda el `id` y el secreto que Funnelchat devuelve una
   sola vez.
3. Cada entrega llega firmada. El nodo **verifica la firma** antes de arrancar el flujo y **rechaza con `400`** las que
   no son válidas: el flujo no corre.
4. Al **desactivar** el flujo, el nodo borra su suscripción (`DELETE /api/v1/webhooks/{id}`). Solo toca la que creó: las
   demás suscripciones de la cuenta no se tocan.

Si cambiás los eventos o el filtro y volvés a activar, el nodo actualiza su suscripción en el lugar
(`PUT /api/v1/webhooks/{id}`) y el secreto no cambia. Si la suscripción ya no existe o quedó deshabilitada, crea otra.
**Listen for test event** crea una suscripción aparte para la URL de prueba de n8n y la borra al terminar.

**Opciones:** una **Descripción** propia para reconocer la suscripción, y **IDs de campaña** para recibir solo eventos
de esas campañas (`filters.campaign_ids`; con filtro, un evento sin campaña no llega).

### Lo que necesitás

- **Una URL `https` pública para n8n** (con Producción o Staging). Funnelchat rechaza URLs `http`, direcciones
  internas y URLs con usuario y contraseña. En self-hosted, configurá `WEBHOOK_URL` con tu dominio o usá un túnel. Con
  una URL base personalizada (el sandbox), sirve también la URL local de n8n, como `http://localhost:5678`: el nodo no
  filtra la URL, la decide la API.
- **Una clave del titular de la cuenta**, con `webhooks:read` y `webhooks:write` y el permiso de lectura del área de
  cada evento que elegís (por ejemplo, `conversations:read` para `message.received`, `communities:read` para los de
  grupos). Sin el de un área, el alta responde `422` en `events`.
- **Lugar en la cuenta:** hay un tope de 50 suscripciones por cuenta.

### Qué llega al flujo

Un ítem por entrega, con el sobre del evento tal como lo manda Funnelchat:

```json
{
  "id": "evt_000000000000000000000001",
  "type": "message.received",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "message": { "id": 1001, "type": "text", "text": "Hola, quiero más información", "media": null },
    "contact": { "id": 2001, "name": "Contacto de ejemplo", "phone": "+5491100000000" },
    "receiver": { "phone": "+5491100000001" },
    "device_id": 4521
  }
}
```

La entrega es «al menos una vez»: el mismo evento puede llegar dos veces con el mismo `id`. Si tu flujo no tolera
repetidos, guardá los `id` procesados y descartá los que ya viste. El formato de cada tipo está en el catálogo de eventos
del portal.

### La firma

Cabecera `X-Funnelchat-Signature: t=<unix>,v1=<hex>`. `v1` es el HMAC-SHA256, con el secreto completo de la suscripción
(con su `whsec_`), de `"<t>." + cuerpo crudo`. Puede haber varias `v1` (alcanza con que una coincida) y `t` no puede
alejarse más de 300 segundos del reloj de n8n: mantené el reloj del servidor sincronizado. El código es el del snippet
del portal (`snippets/verificar-firma.js`) y los tests usan sus mismos vectores (`tests/test_firmas.py`).

## Ejemplos de flujos

### Recibir un mensaje y responder

1. **Funnelchat Trigger** — Eventos: «Mensaje recibido (message.received)».
2. **If** (opcional) — seguí solo si `{{ $json.data.message.type }}` es `text`.
3. **Funnelchat** — Recurso «Conversaciones y mensajes», operación «Enviar un mensaje a un contacto»:
   - ID del contacto (en la ruta y en el cuerpo): `{{ $json.data.contact.id }}`
   - ID del número: `{{ $json.data.device_id }}` (puede venir `null`; entonces, el id de «Números → Listar números»).
   - Campos adicionales → Teléfono: `{{ $json.data.contact.phone }}`. Con una clave es obligatorio (o ID de WhatsApp)
     y tiene que ser el del contacto: si no, `422 recipient_mismatch`.
   - Campos adicionales → Texto: `¡Gracias por escribirnos! Te respondemos en un rato.`

Respondé dentro de la ventana de 24 horas del contacto: fuera de ella, WhatsApp pide una plantilla («Plantillas →
Enviar una plantilla») y el envío responde `422 window_closed`.

### Mandar un formulario de WhatsApp y recibir las respuestas

1. **Funnelchat** — Recurso «Formularios de WhatsApp», operación «Enviar un formulario a un contacto»: ID del contacto,
   **ID del formulario** (el `family_id` de «Listar formularios», no el id de una versión) y el ID de un número donde
   esté publicado. Sale el mensaje en cola, de tipo `whatsapp_form`.
2. En otro flujo, **Funnelchat Trigger** con el evento «Formulario de WhatsApp completado
   (whatsapp_form.completed)»: llega con `data.form`, `data.contact_id`, `data.message_id` (el id que devolvió el
   envío) y `data.answers`, una lista de `{key, label, value}`.

Los formularios se arman, validan en Meta y publican con las demás operaciones del recurso («Crear un formulario»,
«Guardar un formulario», «Validar un formulario en Meta», «Publicar un formulario»).

### Crear un contacto desde un formulario

1. **n8n Form Trigger** — campos «Nombre», «Email» y «Teléfono» (o un **Webhook** que reciba tu formulario).
2. **Funnelchat** — Recurso «Contactos», operación «Crear o actualizar un contacto»:
   - Teléfono: `{{ $json["Teléfono"] }}`, con código de país (con o sin `+`).
   - Campos adicionales → Nombre: `{{ $json["Nombre"] }}`, Email: `{{ $json["Email"] }}`.

   Si el teléfono ya existe, actualiza ese contacto; si no, lo crea. Es seguro reintentarlo.
3. **Funnelchat** (opcional) — operación «Agregar una nota a un contacto»: ID del contacto `{{ $json.id }}`, Texto de la
   nota `Llegó desde el formulario de la web`.

Para buscar después ese contacto por teléfono, sacale el `+`: la API guarda el teléfono sin `+` y la búsqueda por
`phone` no lo quita.

## Probar con el sandbox

[`funnelchat-sandbox`](https://github.com/Funnelchat20/funnelchat-sandbox) imita la API pública en tu máquina, con
estado en memoria y webhooks firmados, y no tiene efectos reales: nada sale a WhatsApp. Está en su PR #1, sin mergear al
16-10-2026; cómo levantarlo está en su README. Por defecto escucha en `http://localhost:4010`.

1. **Levantá el sandbox**, por ejemplo con `npx funnelchat-sandbox` o
   `docker run --rm -p 4010:4010 funnelchat-sandbox`. Su panel está en `http://localhost:4010/_sandbox`.
2. **Creá una credencial Funnelchat API** para el sandbox:
   - **Entorno**: **Personalizado**.
   - **URL base**: `http://localhost:4010`. Si n8n corre en Docker y el sandbox en tu máquina,
     `http://host.docker.internal:4010` (con Podman, `http://host.containers.internal:4010`).
   - **Clave de API**: `1|fc_live_sandbox`. El sandbox acepta cualquier clave con la forma de una real, y todas tienen
     todos los permisos.

   La prueba de la credencial llama a `GET /api/v1/me` del sandbox.
3. **Acciones.** Cualquier operación del nodo anda contra el sandbox. Contactos, conversaciones y mensajes, etiquetas,
   campos personalizados, plantillas, números y suscripciones de webhooks guardan lo que hacés; el resto responde un
   ejemplo armado de la especificación. El envío con clave ya está abierto en el sandbox, con la ventana de 24 horas y
   los frenos contra spam de la API.
4. **Disparador.** El sandbox acepta URLs `http` y locales, así que un n8n en `http://localhost:5678` recibe los
   eventos. Activá el flujo con el **Funnelchat Trigger** y simulá un mensaje entrante:

   ```bash
   curl -s -X POST http://localhost:4010/_sandbox/inbound/message \
     -H 'Content-Type: application/json' \
     -d '{"phone": "5491100000000", "device_id": 3, "text": "Hola"}'
   ```

   El sandbox firma la entrega como la API, el nodo verifica la firma y el flujo arranca con el evento
   `message.received`. Si n8n corre en Docker, configurale `WEBHOOK_URL` con una URL que el sandbox alcance (por
   ejemplo `http://localhost:5678/` publicando ese puerto, o `http://host.docker.internal:5678/` si el sandbox también
   corre en Docker).
5. **Lo que el sandbox no te muestra:** con la API real, la URL de n8n tiene que ser `https` y pública (probalo con
   `npx funnelchat-sandbox --require-https`).

Probado el 16-10-2026 con n8n 2.25.7 y el sandbox en `feat/inicial` @ `7a1b3d8`. Contra el sandbox salieron bien la prueba
de la credencial, un flujo con «Crear o actualizar un contacto» y «Listar etiquetas», y el ciclo completo del
disparador: alta al activar, entrega firmada que arranca el flujo, `400` a una firma falsa y baja al desactivar.

## Cómo regenerar

Las operaciones del nodo no se escriben a mano: salen de `spec/funnelchat.json` con `npm run generate`. Cuando el portal
publique una especificación nueva:

1. Copiá la especificación unificada del portal (`out/specs/funnelchat.json`, que arma su build) a
   `spec/funnelchat.json`.
2. Anotá en `spec/PROCEDENCIA.md` de dónde salió: rama, commit, fecha y SHA-256 (`shasum -a 256 spec/funnelchat.json`).
   El generador se niega a correr si el SHA-256 no figura ahí.
3. Corré `npm run generate`. Actualiza `nodes/Funnelchat/generated/operations.ts` y la tabla de operaciones de este
   README, y avisa lo que conviene revisar (por ejemplo, una etiqueta del config que ya no existe).
4. Revisá el diff y corré `npm run lint`, `npm run build` y `npm test`.

Lo que cambia solo, sin tocar código: operaciones nuevas, nombres, descripciones, permisos, notas del portal, campos y
paginación. Lo que se configura en `scripts/generator.config.json`: qué etiquetas (tags) de la especificación entran en
cada recurso, los nombres en español de los campos (los que no figuran se muestran con su nombre de la API) y, en
`operationNotes`, avisos de lo que el código de un dominio exige y su especificación no dice. Al regenerar, revisá si
esos avisos siguen haciendo falta.

- **Suplementos.** `spec/suplementos/` tiene lo que la especificación todavía no trae: las suscripciones de webhooks de
  accounts y, de conversations `v1.18.10`, el envío con clave, la lectura de un mensaje y los formularios. Si una
  especificación nueva incluye una ruta de un suplemento común, el generador usa la de la especificación y avisa que
  sobra. Un suplemento con `"reemplaza": true` (el de conversations) gana sobre la especificación, con el mismo
  `operationId`, y el generador lo avisa en cada corrida: cuando la especificación lo traiga al día, sacalo del config.
- **Catálogo de eventos.** `spec/eventos-webhooks.json` es una copia de `GET /api/v1/webhooks/events` (la lista de
  respaldo del disparador). Reemplazala por una copia nueva (por ejemplo `snapshots/accounts/events.json` del portal),
  anotala en `spec/PROCEDENCIA.md` y regenerá.
- **Ojo con los cambios de `operationId`.** El valor de cada operación en n8n es su `operationId`. Si la especificación
  lo cambia, los flujos guardados con la operación vieja dejan de encontrarla.

## Desarrollo

```bash
npm ci
npm run generate -- --check   # lo generado está al día con spec/
npm run lint                  # linter de n8n para nodos comunitarios (modo estricto)
npm run build
npm test                      # vitest, sin red ni claves: respuestas simuladas
FUNNELCHAT_SANDBOX_URL=http://127.0.0.1:4010 npm run test:e2e   # e2e contra un sandbox levantado
npm run dev                   # levanta n8n en http://localhost:5678 con el nodo cargado
```

- `nodes/Funnelchat/`: el nodo de acciones. `generated/operations.ts` es la tabla generada; `description.ts` arma los
  campos a partir de ella y `request.ts` arma los pedidos (ruta, consulta y cuerpo) y la paginación.
- `nodes/FunnelchatTrigger/`: el disparador.
- `nodes/shared/`: el transporte (clave, URL base, errores, `429`) y la verificación de la firma.
- `test/`: la firma con los vectores del portal, el armado de pedidos y la paginación, el ciclo crear, confirmar y
  borrar suscripción del disparador, y la URL base personalizada.
- `test/e2e/`: el nodo con HTTP real contra el sandbox: envío y lectura de un mensaje, archivo por URL, `X-Request-Id`
  en los errores y el ciclo del disparador con un aviso firmado de verdad. Sin `FUNNELCHAT_SANDBOX_URL` se saltea.

La interfaz está en español. Algunas reglas del linter de n8n exigen textos en inglés (por ejemplo, que la descripción
de un booleano empiece con «Whether»); donde chocan, la excepción está marcada en el código con su motivo.

## Fuentes y lo que falta verificar

| Qué | De dónde sale | Estado al 22-10-2026 |
|---|---|---|
| La especificación unificada (la mayoría de las operaciones) | developers-portal, la misma que publica el portal (instantánea de los dominios del 13-10) | Publicada; el portal la regenera desde los tags de production |
| Envío con clave, mensaje por id y formularios | conversations tag `v1.18.10` (production), leído del código | Abierto a claves. Los `operationId` nuevos no están verificados contra una especificación generada |
| Las suscripciones de webhooks (disparador y recurso Webhooks) | accounts tag `v1.4.24` (production), leído del código | Abiertas a claves con `webhooks:read` / `webhooks:write` |
| El catálogo de eventos de respaldo del disparador | accounts tag `v1.4.24`, extraído del código | 54 tipos, 49 emitiéndose |
| El algoritmo y los vectores de la firma, el sobre de los eventos | developers-portal (`snippets/verificar-firma.js`, `tests/test_firmas.py`) | Publicados |
| El sandbox local de «Probar con el sandbox» | funnelchat-sandbox `feat/inicial` | PR funnelchat-sandbox #1, sin mergear |

El detalle de cada fuente está en [`spec/PROCEDENCIA.md`](spec/PROCEDENCIA.md).
