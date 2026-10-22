// Generado por scripts/generate.mjs a partir de spec/funnelchat.json y sus suplementos.
// No editar a mano: cambiá la especificación o scripts/generator.config.json y corré `npm run generate`.
// Especificación: Funnelchat API v0, sha256 8bbbae569b4cab520884db98f28204156c1bd6c629578bee609343c193e0dadb.

import type { OperationSpec, ResourceSpec, SpecSource } from '../operationTypes';

export const SPEC_SOURCE: SpecSource = {
	"title": "Funnelchat API v0",
	"sha256": "8bbbae569b4cab520884db98f28204156c1bd6c629578bee609343c193e0dadb",
	"description": "Toda la API pública de Funnelchat detrás de una sola URL base (`https://api.funnelchat.com`), con las rutas completas `/api/v1/…`. La arma el portal a partir de las instantáneas de cada dominio: conversations `9d723d52c` (2026-10-13 10:41 (-03:00)); communities `fab0bb10` (2026-10-13 10:41 (-03:00)); accounts `c234b6f8` (2026-10-13 10:41 (-03:00)).",
	"supplements": [
		{
			"id": "accounts-webhook-subscriptions",
			"source": "accounts tag v1.4.24 @ 300cc8435e6fa17e2ac274b88289a2cc7b945fcd (2026-10-22 08:31 -03:00, el que corre en production), solo lectura",
			"used": 7,
			"ignored": 0
		}
	]
};

export const RESOURCES: ResourceSpec[] = [
	{
		"value": "contact",
		"name": "Contactos",
		"description": "Un contacto es la persona con la que tu negocio conversa por WhatsApp, identificada por `phone` o `whatsapp_id`."
	},
	{
		"value": "conversation",
		"name": "Conversaciones y mensajes",
		"description": "Una conversación es el chat de WhatsApp entre tu negocio y un contacto: puede estar activa o no (`active_conversation`), asignada a un asesor, marcada como favorita o sin leer, y la atiende uno de tus…"
	},
	{
		"value": "template",
		"name": "Plantillas",
		"description": "Una plantilla es un mensaje de WhatsApp que Meta aprueba antes de usarse, con encabezado, cuerpo con variables, pie y botones, asociado a un número (`device_id`) y su WABA."
	},
	{
		"value": "tag",
		"name": "Etiquetas",
		"description": "Las etiquetas (`name`, `description`, `color`) marcan contactos para segmentarlos según los criterios de tu negocio, y cada una puede informar cuántos contactos la tienen (`contact_count`)."
	},
	{
		"value": "customField",
		"name": "Campos personalizados",
		"description": "Un campo personalizado es un dato propio de tu negocio que guardás en los contactos, como plan, ciudad o fecha de compra."
	},
	{
		"value": "group",
		"name": "Grupos",
		"description": "Un grupo es un grupo de WhatsApp que administra uno de tus números, con o sin campaña asignada; acá también aparecen los canales y los grupos de anuncios de una comunidad."
	},
	{
		"value": "device",
		"name": "Números",
		"description": "Un número es una línea de WhatsApp conectada a tu cuenta (en las rutas, `devices`), por código QR o por WhatsApp Cloud."
	},
	{
		"value": "webhook",
		"name": "Webhooks",
		"description": "Una suscripción recibe, en una URL https, los eventos elegidos de las tres áreas (accounts, conversations y communities) con un solo secreto y un solo historial de entregas."
	}
];

export const OPERATIONS: OperationSpec[] = [
	{
		"resource": "contact",
		"value": "contact.index",
		"name": "Listar contactos",
		"description": "Usalo para buscar y segmentar contactos desde tu sistema: filtrá por nombre, teléfono, email, etiquetas, campos personalizados, país, fecha de alta o lead score. Es la base para sincronizar o exportar tu CRM. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/contacts",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "name",
				"apiName": "name",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "email",
				"apiName": "email",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Email",
				"description": "En la API: email.",
				"valueType": "string"
			},
			{
				"name": "phone",
				"apiName": "phone",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Teléfono",
				"description": "En la API: phone.",
				"valueType": "string"
			},
			{
				"name": "whatsapp_id",
				"apiName": "whatsapp_id",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "ID de WhatsApp",
				"description": "En la API: whatsapp_id.",
				"valueType": "string"
			},
			{
				"name": "country_codes",
				"apiName": "country_codes[]",
				"location": "query",
				"required": false,
				"kind": "list",
				"displayName": "Códigos de país",
				"description": "Separá los valores con comas. En la API: country_codes[].",
				"valueType": "string"
			},
			{
				"name": "status",
				"apiName": "status",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Estado",
				"description": "En la API: status.",
				"valueType": "string"
			},
			{
				"name": "image",
				"apiName": "image",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Imagen (URL)",
				"description": "En la API: image.",
				"valueType": "string"
			},
			{
				"name": "created_at",
				"apiName": "created_at",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Fecha de alta",
				"description": "En la API: created_at.",
				"format": "date-time"
			},
			{
				"name": "created_from",
				"apiName": "created_from",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Creado desde",
				"description": "En la API: created_from.",
				"format": "date-time"
			},
			{
				"name": "created_to",
				"apiName": "created_to",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Creado hasta",
				"description": "En la API: created_to.",
				"format": "date-time"
			},
			{
				"name": "tag_ids",
				"apiName": "tag_ids[]",
				"location": "query",
				"required": false,
				"kind": "list",
				"displayName": "IDs de etiquetas",
				"description": "Separá los valores con comas. En la API: tag_ids[].",
				"valueType": "integer"
			},
			{
				"name": "tag_mode",
				"apiName": "tag_mode",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Modo de etiquetas",
				"description": "En la API: tag_mode.",
				"valueType": "string",
				"options": [
					"all",
					"any",
					"exclude"
				]
			},
			{
				"name": "custom_field_ids",
				"apiName": "custom_field_ids[]",
				"location": "query",
				"required": false,
				"kind": "list",
				"displayName": "IDs de campos personalizados",
				"description": "Separá los valores con comas. En la API: custom_field_ids[].",
				"valueType": "integer"
			},
			{
				"name": "custom_field_mode",
				"apiName": "custom_field_mode",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Modo de campos personalizados",
				"description": "En la API: custom_field_mode.",
				"valueType": "string",
				"options": [
					"all",
					"any",
					"exclude"
				]
			},
			{
				"name": "custom_field_value",
				"apiName": "custom_field_value",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Valor del campo personalizado",
				"description": "En la API: custom_field_value.",
				"valueType": "string"
			},
			{
				"name": "custom_field_date_from",
				"apiName": "custom_field_date_from",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Fecha del campo desde",
				"description": "En la API: custom_field_date_from.",
				"format": "date"
			},
			{
				"name": "custom_field_date_to",
				"apiName": "custom_field_date_to",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Fecha del campo hasta",
				"description": "En la API: custom_field_date_to.",
				"format": "date"
			},
			{
				"name": "custom_field_numeric_operator",
				"apiName": "custom_field_numeric_operator",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Operador numérico del campo",
				"description": "En la API: custom_field_numeric_operator.",
				"valueType": "string",
				"options": [
					"lt",
					"eq",
					"gt"
				]
			},
			{
				"name": "custom_field_numeric_value",
				"apiName": "custom_field_numeric_value",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "Valor numérico del campo",
				"description": "En la API: custom_field_numeric_value.",
				"valueType": "number"
			},
			{
				"name": "only_with_phone",
				"apiName": "only_with_phone",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Solo con teléfono",
				"description": "En la API: only_with_phone.",
				"valueType": "string"
			},
			{
				"name": "only_with_mac",
				"apiName": "only_with_mac",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Solo con MAC",
				"description": "En la API: only_with_mac.",
				"valueType": "string"
			},
			{
				"name": "scopeToAdvisor",
				"apiName": "scopeToAdvisor",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Solo del asesor",
				"description": "En la API: scopeToAdvisor.",
				"valueType": "string"
			},
			{
				"name": "lead_score_categories",
				"apiName": "lead_score_categories[]",
				"location": "query",
				"required": false,
				"kind": "multiOptions",
				"displayName": "Categorías de lead score",
				"description": "En la API: lead_score_categories[].",
				"valueType": "string",
				"options": [
					"insufficient_data",
					"hot",
					"warm",
					"cold"
				]
			},
			{
				"name": "lead_score_min",
				"apiName": "lead_score_min",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "Lead score mínimo",
				"description": "En la API: lead_score_min.",
				"valueType": "integer"
			},
			{
				"name": "lead_score_max",
				"apiName": "lead_score_max",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "Lead score máximo",
				"description": "En la API: lead_score_max.",
				"valueType": "integer"
			},
			{
				"name": "lead_score_disqualified",
				"apiName": "lead_score_disqualified",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Descalificados",
				"description": "En la API: lead_score_disqualified.",
				"valueType": "string",
				"options": [
					"include",
					"exclude",
					"only"
				]
			},
			{
				"name": "tag_filters",
				"apiName": "tag_filters",
				"location": "query",
				"required": false,
				"kind": "json",
				"displayName": "Filtros de etiquetas",
				"description": "En la API: tag_filters."
			},
			{
				"name": "custom_field_filters",
				"apiName": "custom_field_filters",
				"location": "query",
				"required": false,
				"kind": "json",
				"displayName": "Filtros de campos personalizados",
				"description": "En la API: custom_field_filters."
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string",
				"options": [
					"id",
					"name",
					"email",
					"phone",
					"status",
					"favorite",
					"unread_messages",
					"created_at",
					"updated_at"
				]
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string",
				"options": [
					"asc",
					"desc"
				]
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.store",
		"name": "Crear un contacto",
		"description": "Sirve para dar de alta un contacto nuevo (teléfono o WhatsApp ID, nombre, email) cuando sabés que no existe. Si no estás seguro, usá la operación de crear o actualizar. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/contacts",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "object"
		},
		"params": [
			{
				"name": "phone",
				"apiName": "phone",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Teléfono",
				"description": "En la API: phone.",
				"valueType": "string"
			},
			{
				"name": "whatsapp_id",
				"apiName": "whatsapp_id",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "ID de WhatsApp",
				"description": "En la API: whatsapp_id.",
				"valueType": "string"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "email",
				"apiName": "email",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Email",
				"description": "En la API: email.",
				"valueType": "string"
			},
			{
				"name": "image",
				"apiName": "image",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Imagen (URL)",
				"description": "En la API: image.",
				"valueType": "string"
			},
			{
				"name": "deviceId",
				"apiName": "deviceId",
				"location": "body",
				"required": false,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: deviceId.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.updateOrCreate",
		"name": "Crear o actualizar un contacto",
		"description": "Usalo para sincronizar contactos desde tu sistema sin duplicarlos: si el teléfono ya existe lo actualiza, si no lo crea. Es la opción segura para reintentos. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/contacts/update-or-create",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "phone",
				"apiName": "phone",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Teléfono",
				"description": "En la API: phone.",
				"valueType": "string"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "email",
				"apiName": "email",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Email",
				"description": "En la API: email.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.attachCustomField",
		"name": "Asignar un campo personalizado a contactos",
		"description": "Usalo para guardar datos propios de tu negocio en los contactos (plan, ciudad, fecha de compra): asigna valores de campos personalizados a uno o varios contactos en una sola llamada. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/contacts/attach-custom-field",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "array"
		},
		"params": [
			{
				"name": "body",
				"apiName": "",
				"location": "body",
				"required": true,
				"kind": "body",
				"displayName": "Elementos (JSON)",
				"description": "Lista JSON de objetos con customFieldId, contactId, value."
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.detachCustomField",
		"name": "Quitar un campo personalizado de contactos",
		"description": "Sirve para borrar el valor de un campo personalizado en uno o varios contactos, por ejemplo cuando un dato quedó desactualizado en tu sistema. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/contacts/detach-custom-field",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "array"
		},
		"params": [
			{
				"name": "body",
				"apiName": "",
				"location": "body",
				"required": true,
				"kind": "body",
				"displayName": "Elementos (JSON)",
				"description": "Lista JSON de objetos con customFieldId, contactId."
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.show",
		"name": "Ver un contacto",
		"description": "Usalo para traer la ficha completa de un contacto: datos, campos personalizados, estado de la conversación, mensajes sin leer y último mensaje. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/contacts/{contact}",
		"permission": "conversations:read",
		"source": "spec",
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.update",
		"name": "Actualizar un contacto",
		"description": "Sirve para mantener al día la ficha de un contacto desde tu sistema: nombre, email, teléfono, notas, asesor asignado, favorito o si puede ejecutar flujos. Permiso: conversations:write.",
		"method": "PUT",
		"path": "/api/v1/contacts/{contact}",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "object"
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "email",
				"apiName": "email",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Email",
				"description": "En la API: email.",
				"valueType": "string"
			},
			{
				"name": "phone",
				"apiName": "phone",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Teléfono",
				"description": "En la API: phone.",
				"valueType": "string"
			},
			{
				"name": "notes",
				"apiName": "notes",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Notas",
				"description": "En la API: notes.",
				"valueType": "string"
			},
			{
				"name": "status",
				"apiName": "status",
				"location": "body",
				"required": false,
				"kind": "number",
				"displayName": "Estado",
				"description": "En la API: status.",
				"valueType": "integer"
			},
			{
				"name": "adviser_id",
				"apiName": "adviser_id",
				"location": "body",
				"required": false,
				"kind": "number",
				"displayName": "ID del asesor",
				"description": "En la API: adviser_id.",
				"valueType": "integer"
			},
			{
				"name": "active_conversation",
				"apiName": "active_conversation",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Conversación activa",
				"description": "En la API: active_conversation.",
				"valueType": "boolean"
			},
			{
				"name": "favorite",
				"apiName": "favorite",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Favorito",
				"description": "En la API: favorite.",
				"valueType": "boolean"
			},
			{
				"name": "fixed",
				"apiName": "fixed",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Fijado",
				"description": "En la API: fixed.",
				"valueType": "boolean"
			},
			{
				"name": "image",
				"apiName": "image",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Imagen (URL)",
				"description": "En la API: image.",
				"valueType": "string"
			},
			{
				"name": "can_execute_flows",
				"apiName": "can_execute_flows",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Puede ejecutar flujos",
				"description": "En la API: can_execute_flows.",
				"valueType": "boolean"
			},
			{
				"name": "manually_unread",
				"apiName": "manually_unread",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Marcado como no leído",
				"description": "En la API: manually_unread.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.tags",
		"name": "Listar las etiquetas de un contacto",
		"description": "Usalo para saber qué etiquetas tiene un contacto, por ejemplo para reflejar su segmento en tu CRM o decidir qué acción tomar. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/contacts/{contact}/tags",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.customFields",
		"name": "Listar los campos personalizados de un contacto",
		"description": "Sirve para leer los valores de los campos personalizados de un contacto, con búsqueda por nombre de campo. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/contacts/{contact}/custom-fields",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.metaWindow",
		"name": "Ver la ventana de 24 horas de un contacto",
		"description": "Usalo antes de escribirle a un contacto para saber si su ventana de 24 horas de Meta está abierta en un número, y así decidir si podés mandar un mensaje libre o necesitás una plantilla. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/contacts/{contact}/meta-window",
		"permission": "conversations:read",
		"source": "spec",
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "device_id",
				"apiName": "device_id",
				"location": "query",
				"required": true,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: device_id.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.contactsByDevice",
		"name": "Listar los contactos de un número",
		"description": "Sirve para listar los contactos asociados a uno de tus números conectados, útil si manejás varios números y querés separar la base por cada uno. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/contacts",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contact.destroy",
		"name": "Eliminar contactos",
		"description": "Usalo para borrar contactos en bloque: por IDs, por filtros (etiquetas, campos personalizados, país, fecha de alta) o todos. Ideal para limpiezas masivas de la base. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/contacts/delete",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "object"
		},
		"params": [
			{
				"name": "all",
				"apiName": "all",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Todos",
				"description": "En la API: all.",
				"valueType": "boolean"
			},
			{
				"name": "contactIds",
				"apiName": "contactIds",
				"location": "body",
				"required": false,
				"kind": "list",
				"displayName": "IDs de contactos",
				"description": "Separá los valores con comas. En la API: contactIds.",
				"valueType": "integer"
			},
			{
				"name": "created_from",
				"apiName": "created_from",
				"location": "body",
				"required": false,
				"kind": "dateTime",
				"displayName": "Creado desde",
				"description": "En la API: created_from.",
				"format": "date-time"
			},
			{
				"name": "created_to",
				"apiName": "created_to",
				"location": "body",
				"required": false,
				"kind": "dateTime",
				"displayName": "Creado hasta",
				"description": "En la API: created_to.",
				"format": "date-time"
			},
			{
				"name": "tag_mode",
				"apiName": "tag_mode",
				"location": "body",
				"required": false,
				"kind": "options",
				"displayName": "Modo de etiquetas",
				"description": "En la API: tag_mode.",
				"valueType": "string",
				"options": [
					"all",
					"any",
					"exclude"
				]
			},
			{
				"name": "tag_ids",
				"apiName": "tag_ids",
				"location": "body",
				"required": false,
				"kind": "list",
				"displayName": "IDs de etiquetas",
				"description": "Separá los valores con comas. En la API: tag_ids.",
				"valueType": "integer"
			},
			{
				"name": "tag_filters",
				"apiName": "tag_filters",
				"location": "body",
				"required": false,
				"kind": "json",
				"displayName": "Filtros de etiquetas",
				"description": "En la API: tag_filters."
			},
			{
				"name": "custom_field_mode",
				"apiName": "custom_field_mode",
				"location": "body",
				"required": false,
				"kind": "options",
				"displayName": "Modo de campos personalizados",
				"description": "En la API: custom_field_mode.",
				"valueType": "string",
				"options": [
					"all",
					"any",
					"exclude"
				]
			},
			{
				"name": "custom_field_ids",
				"apiName": "custom_field_ids",
				"location": "body",
				"required": false,
				"kind": "list",
				"displayName": "IDs de campos personalizados",
				"description": "Separá los valores con comas. En la API: custom_field_ids.",
				"valueType": "integer"
			},
			{
				"name": "custom_field_value",
				"apiName": "custom_field_value",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Valor del campo personalizado",
				"description": "En la API: custom_field_value.",
				"valueType": "string"
			},
			{
				"name": "custom_field_date_from",
				"apiName": "custom_field_date_from",
				"location": "body",
				"required": false,
				"kind": "dateTime",
				"displayName": "Fecha del campo desde",
				"description": "En la API: custom_field_date_from.",
				"format": "date"
			},
			{
				"name": "custom_field_date_to",
				"apiName": "custom_field_date_to",
				"location": "body",
				"required": false,
				"kind": "dateTime",
				"displayName": "Fecha del campo hasta",
				"description": "En la API: custom_field_date_to.",
				"format": "date"
			},
			{
				"name": "custom_field_numeric_operator",
				"apiName": "custom_field_numeric_operator",
				"location": "body",
				"required": false,
				"kind": "options",
				"displayName": "Operador numérico del campo",
				"description": "En la API: custom_field_numeric_operator.",
				"valueType": "string",
				"options": [
					"lt",
					"eq",
					"gt"
				]
			},
			{
				"name": "custom_field_numeric_value",
				"apiName": "custom_field_numeric_value",
				"location": "body",
				"required": false,
				"kind": "number",
				"displayName": "Valor numérico del campo",
				"description": "En la API: custom_field_numeric_value.",
				"valueType": "number"
			},
			{
				"name": "custom_field_filters",
				"apiName": "custom_field_filters",
				"location": "body",
				"required": false,
				"kind": "json",
				"displayName": "Filtros de campos personalizados",
				"description": "En la API: custom_field_filters."
			},
			{
				"name": "country_codes",
				"apiName": "country_codes",
				"location": "body",
				"required": false,
				"kind": "list",
				"displayName": "Códigos de país",
				"description": "Separá los valores con comas. En la API: country_codes.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contactNote.index",
		"name": "Listar las notas de un contacto",
		"description": "Sirve para leer las notas que el equipo dejó sobre un contacto, con autor y fecha, y buscar por texto. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/contacts/{contact}/notes",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "search",
				"apiName": "search",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Buscar",
				"description": "En la API: search.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contactNote.store",
		"name": "Agregar una nota a un contacto",
		"description": "Usalo para dejar registro en la ficha del contacto de algo que pasó en tu sistema, como una llamada, una compra o un reclamo. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/contacts/{contact}/notes",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "body",
				"apiName": "body",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Texto de la nota",
				"description": "En la API: body.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "contact",
		"value": "contactNote.destroy",
		"name": "Eliminar una nota",
		"description": "Sirve para borrar una nota de un contacto que quedó obsoleta o se cargó por error. Permiso: conversations:write.",
		"method": "DELETE",
		"path": "/api/v1/contacts/{contact}/notes/{note}",
		"permission": "conversations:write",
		"source": "spec",
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "note",
				"apiName": "note",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la nota",
				"description": "En la API: note.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "conversation.index",
		"name": "Listar conversaciones",
		"description": "Usalo para construir tu propia bandeja de entrada o sincronizar conversaciones: filtrá por número, asesor, etiquetas, etapa del kanban, no leídas o lead score, y traé solo lo nuevo con `updated_since`. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/conversations",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "cursor",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "favorites",
				"apiName": "favorites",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo favoritos",
				"description": "En la API: favorites.",
				"valueType": "boolean"
			},
			{
				"name": "ownContacts",
				"apiName": "ownContacts",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo mis contactos",
				"description": "En la API: ownContacts.",
				"valueType": "boolean"
			},
			{
				"name": "ownAndUnassigned",
				"apiName": "ownAndUnassigned",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Propias y sin asignar",
				"description": "En la API: ownAndUnassigned.",
				"valueType": "boolean"
			},
			{
				"name": "perName",
				"apiName": "perName",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: perName.",
				"valueType": "string"
			},
			{
				"name": "deviceId",
				"apiName": "deviceId",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: deviceId.",
				"valueType": "integer"
			},
			{
				"name": "contactId",
				"apiName": "contactId",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "ID del contacto",
				"description": "En la API: contactId.",
				"valueType": "integer"
			},
			{
				"name": "advisorId",
				"apiName": "advisorId",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "ID del asesor",
				"description": "En la API: advisorId.",
				"valueType": "integer"
			},
			{
				"name": "advisorIds",
				"apiName": "advisorIds",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "IDs de asesores",
				"description": "En la API: advisorIds.",
				"valueType": "string"
			},
			{
				"name": "activeConversation",
				"apiName": "activeConversation",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Conversación activa",
				"description": "En la API: activeConversation.",
				"valueType": "boolean"
			},
			{
				"name": "tags",
				"apiName": "tags",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Etiquetas",
				"description": "En la API: tags.",
				"valueType": "string"
			},
			{
				"name": "kanbanSettingId",
				"apiName": "kanbanSettingId",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "ID del tablero",
				"description": "En la API: kanbanSettingId.",
				"valueType": "integer"
			},
			{
				"name": "kanbanStageIds",
				"apiName": "kanbanStageIds",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "IDs de etapas",
				"description": "En la API: kanbanStageIds.",
				"valueType": "string"
			},
			{
				"name": "unreadMessages",
				"apiName": "unreadMessages",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Sin leer",
				"description": "En la API: unreadMessages.",
				"valueType": "boolean"
			},
			{
				"name": "onlyWithMac",
				"apiName": "onlyWithMac",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo con MAC",
				"description": "En la API: onlyWithMac.",
				"valueType": "boolean"
			},
			{
				"name": "updated_since",
				"apiName": "updated_since",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Actualizadas desde",
				"description": "En la API: updated_since.",
				"valueType": "string"
			},
			{
				"name": "paused",
				"apiName": "paused",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Pausados",
				"description": "En la API: paused.",
				"valueType": "string",
				"options": [
					"true",
					"false",
					"1",
					"0"
				]
			},
			{
				"name": "leadScoreCategories",
				"apiName": "leadScoreCategories",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Categorías de lead score",
				"description": "En la API: leadScoreCategories.",
				"valueType": "string"
			},
			{
				"name": "leadScoreMin",
				"apiName": "leadScoreMin",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "Lead score mínimo",
				"description": "En la API: leadScoreMin.",
				"valueType": "integer"
			},
			{
				"name": "leadScoreMax",
				"apiName": "leadScoreMax",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "Lead score máximo",
				"description": "En la API: leadScoreMax.",
				"valueType": "integer"
			},
			{
				"name": "leadScoreDisqualified",
				"apiName": "leadScoreDisqualified",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Descalificados",
				"description": "En la API: leadScoreDisqualified.",
				"valueType": "string",
				"options": [
					"include",
					"exclude",
					"only"
				]
			},
			{
				"name": "metaWindowOpen",
				"apiName": "metaWindowOpen",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Ventana de 24 h abierta",
				"description": "En la API: metaWindowOpen.",
				"valueType": "boolean"
			},
			{
				"name": "metaWindowDeviceIds",
				"apiName": "metaWindowDeviceIds",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Números para la ventana de 24 h",
				"description": "En la API: metaWindowDeviceIds.",
				"valueType": "string"
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string",
				"options": [
					"asc",
					"desc"
				]
			}
		]
	},
	{
		"resource": "conversation",
		"value": "conversation.countUnread",
		"name": "Contar conversaciones sin leer",
		"description": "Sirve para mostrar un contador de conversaciones sin leer, por ejemplo en un badge o tablero, filtrable por asesores o favoritas. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/conversations/count/unread",
		"permission": "conversations:read",
		"source": "spec",
		"params": [
			{
				"name": "advisorIds",
				"apiName": "advisorIds",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "IDs de asesores",
				"description": "En la API: advisorIds.",
				"valueType": "string"
			},
			{
				"name": "favorites",
				"apiName": "favorites",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo favoritos",
				"description": "En la API: favorites.",
				"valueType": "boolean"
			},
			{
				"name": "ownAndUnassigned",
				"apiName": "ownAndUnassigned",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Propias y sin asignar",
				"description": "En la API: ownAndUnassigned.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "conversation.countOpen",
		"name": "Contar conversaciones abiertas",
		"description": "Usalo para medir la carga de trabajo actual: cuántas conversaciones abiertas hay, en total o por asesor. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/conversations/count/open",
		"permission": "conversations:read",
		"source": "spec",
		"params": [
			{
				"name": "advisorIds",
				"apiName": "advisorIds",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "IDs de asesores",
				"description": "En la API: advisorIds.",
				"valueType": "string"
			},
			{
				"name": "favorites",
				"apiName": "favorites",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo favoritos",
				"description": "En la API: favorites.",
				"valueType": "boolean"
			},
			{
				"name": "ownAndUnassigned",
				"apiName": "ownAndUnassigned",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Propias y sin asignar",
				"description": "En la API: ownAndUnassigned.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "conversation.countClosed",
		"name": "Contar conversaciones cerradas",
		"description": "Sirve para contar las conversaciones cerradas, por ejemplo para métricas de atención por asesor. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/conversations/count/closed",
		"permission": "conversations:read",
		"source": "spec",
		"params": [
			{
				"name": "advisorIds",
				"apiName": "advisorIds",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "IDs de asesores",
				"description": "En la API: advisorIds.",
				"valueType": "string"
			},
			{
				"name": "favorites",
				"apiName": "favorites",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo favoritos",
				"description": "En la API: favorites.",
				"valueType": "boolean"
			},
			{
				"name": "ownAndUnassigned",
				"apiName": "ownAndUnassigned",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Propias y sin asignar",
				"description": "En la API: ownAndUnassigned.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "conversation.countAll",
		"name": "Contar todas las conversaciones",
		"description": "Usalo para obtener el total de conversaciones, como base para calcular la proporción de abiertas, cerradas o sin leer. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/conversations/count/all",
		"permission": "conversations:read",
		"source": "spec",
		"params": [
			{
				"name": "advisorIds",
				"apiName": "advisorIds",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "IDs de asesores",
				"description": "En la API: advisorIds.",
				"valueType": "string"
			},
			{
				"name": "favorites",
				"apiName": "favorites",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo favoritos",
				"description": "En la API: favorites.",
				"valueType": "boolean"
			},
			{
				"name": "ownAndUnassigned",
				"apiName": "ownAndUnassigned",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Propias y sin asignar",
				"description": "En la API: ownAndUnassigned.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "conversation.markAllAsRead",
		"name": "Marcar todas como leídas",
		"description": "Sirve para poner en cero los no leídos de una vez, por ejemplo cuando ya atendiste por otro canal; se puede acotar por asesores o favoritas. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/conversations/mark-all-read",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "object"
		},
		"params": [
			{
				"name": "advisorIds",
				"apiName": "advisorIds",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "IDs de asesores",
				"description": "En la API: advisorIds.",
				"valueType": "string"
			},
			{
				"name": "favorites",
				"apiName": "favorites",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo favoritos",
				"description": "En la API: favorites.",
				"valueType": "boolean"
			},
			{
				"name": "ownAndUnassigned",
				"apiName": "ownAndUnassigned",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Propias y sin asignar",
				"description": "En la API: ownAndUnassigned.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "conversation.markAllAsUnread",
		"name": "Marcar todas como no leídas",
		"description": "Usalo para volver a marcar como no leídas las conversaciones de un conjunto (por asesores o favoritas) y que el equipo las retome. Tiene un tope y la respuesta avisa si se alcanzó. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/conversations/mark-all-unread",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "object"
		},
		"params": [
			{
				"name": "advisorIds",
				"apiName": "advisorIds",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "IDs de asesores",
				"description": "En la API: advisorIds.",
				"valueType": "string"
			},
			{
				"name": "favorites",
				"apiName": "favorites",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo favoritos",
				"description": "En la API: favorites.",
				"valueType": "boolean"
			},
			{
				"name": "ownAndUnassigned",
				"apiName": "ownAndUnassigned",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Propias y sin asignar",
				"description": "En la API: ownAndUnassigned.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "conversation.update",
		"name": "Actualizar la conversación de un contacto",
		"description": "Sirve para gestionar la conversación con un contacto: asignarla a un asesor, abrirla o cerrarla, marcarla como favorita o no leída, o cambiar el número que la atiende. Permiso: conversations:write.",
		"method": "PUT",
		"path": "/api/v1/contacts/{contact}/update",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "object"
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "favorite",
				"apiName": "favorite",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Favorito",
				"description": "En la API: favorite.",
				"valueType": "boolean"
			},
			{
				"name": "active_conversation",
				"apiName": "active_conversation",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Conversación activa",
				"description": "En la API: active_conversation.",
				"valueType": "boolean"
			},
			{
				"name": "unread_messages",
				"apiName": "unread_messages",
				"location": "body",
				"required": false,
				"kind": "number",
				"displayName": "Mensajes sin leer",
				"description": "En la API: unread_messages.",
				"valueType": "integer"
			},
			{
				"name": "adviser_id",
				"apiName": "adviser_id",
				"location": "body",
				"required": false,
				"kind": "number",
				"displayName": "ID del asesor",
				"description": "En la API: adviser_id.",
				"valueType": "integer"
			},
			{
				"name": "device_id",
				"apiName": "device_id",
				"location": "body",
				"required": false,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: device_id.",
				"valueType": "integer"
			},
			{
				"name": "text",
				"apiName": "text",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Texto",
				"description": "En la API: text.",
				"valueType": "string"
			},
			{
				"name": "notes",
				"apiName": "notes",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Notas",
				"description": "En la API: notes.",
				"valueType": "string"
			},
			{
				"name": "custom_fields",
				"apiName": "custom_fields",
				"location": "body",
				"required": false,
				"kind": "list",
				"displayName": "Campos personalizados",
				"description": "Separá los valores con comas. En la API: custom_fields.",
				"valueType": "string"
			},
			{
				"name": "manually_unread",
				"apiName": "manually_unread",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Marcado como no leído",
				"description": "En la API: manually_unread.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "conversation.sendMessage",
		"name": "Enviar un mensaje a un contacto",
		"description": "Usalo para enviarle a un contacto un mensaje de texto o un archivo desde uno de tus números, con opción de responder a un mensaje previo, sumar opciones o vista previa de link. Permiso: conversations:send.",
		"method": "POST",
		"path": "/api/v1/contacts/{contact}/message",
		"permission": "conversations:send",
		"notice": "El envío con clave se abre con el permiso `conversations:send` y las reglas de WhatsApp (ventana de 24 horas y frenos contra spam): está en camino. Hasta que se habilite, esta ruta responde `403 route_not_available` a cualquier clave. El envío con clave llega con conversations PR #2284, sin mergear al 16-10-2026. La especificación no lo marca, pero conversations exige phone o whatsapp_id además de contact_id (SendMessageRequest: required_without, origin/main @ 22f921605): agregá Teléfono o ID de WhatsApp en Campos adicionales.",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "device_id",
				"apiName": "device_id",
				"location": "body",
				"required": true,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: device_id.",
				"valueType": "integer"
			},
			{
				"name": "contact_id",
				"apiName": "contact_id",
				"location": "body",
				"required": true,
				"kind": "number",
				"displayName": "ID del contacto",
				"description": "En la API: contact_id.",
				"valueType": "integer"
			},
			{
				"name": "phone",
				"apiName": "phone",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Teléfono",
				"description": "En la API: phone.",
				"valueType": "string"
			},
			{
				"name": "whatsapp_id",
				"apiName": "whatsapp_id",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "ID de WhatsApp",
				"description": "En la API: whatsapp_id.",
				"valueType": "string"
			},
			{
				"name": "text",
				"apiName": "text",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Texto",
				"description": "En la API: text.",
				"valueType": "string"
			},
			{
				"name": "file",
				"apiName": "file",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Archivo (URL)",
				"description": "En la API: file.",
				"valueType": "string"
			},
			{
				"name": "temporal_uuid",
				"apiName": "temporal_uuid",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "UUID temporal",
				"description": "En la API: temporal_uuid.",
				"valueType": "string"
			},
			{
				"name": "note",
				"apiName": "note",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Como nota interna",
				"description": "En la API: note.",
				"valueType": "boolean"
			},
			{
				"name": "options",
				"apiName": "options",
				"location": "body",
				"required": false,
				"kind": "json",
				"displayName": "Opciones",
				"description": "En la API: options."
			},
			{
				"name": "reference_message_uid",
				"apiName": "reference_message_uid",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "UID del mensaje al que responde",
				"description": "En la API: reference_message_uid.",
				"valueType": "string"
			},
			{
				"name": "link_preview",
				"apiName": "link_preview",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Vista previa del link",
				"description": "En la API: link_preview.",
				"valueType": "boolean"
			},
			{
				"name": "link_preview_meta",
				"apiName": "link_preview_meta",
				"location": "body",
				"required": false,
				"kind": "json",
				"displayName": "Datos de la vista previa",
				"description": "En la API: link_preview_meta."
			}
		]
	},
	{
		"resource": "conversation",
		"value": "conversation.getLatestMessages",
		"name": "Listar los mensajes de un contacto",
		"description": "Sirve para traer el historial de mensajes de un contacto y mantenerlo sincronizado en tu sistema, con paginación por cursor y `updated_since` para pedir solo lo nuevo. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/contacts/{contactId}/messages",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "cursor",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "contactId",
				"apiName": "contactId",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contactId.",
				"valueType": "integer"
			},
			{
				"name": "updated_since",
				"apiName": "updated_since",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Actualizadas desde",
				"description": "En la API: updated_since.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "message.sendMessage",
		"name": "Enviar un mensaje",
		"description": "Sirve para enviar un mensaje de texto o un archivo a un contacto, indicando en el cuerpo el `contact_id` y el número desde el que sale. Permiso: conversations:send.",
		"method": "POST",
		"path": "/api/v1/message/send-message",
		"permission": "conversations:send",
		"notice": "El envío con clave se abre con el permiso `conversations:send` y las reglas de WhatsApp (ventana de 24 horas y frenos contra spam): está en camino. Hasta que se habilite, esta ruta responde `403 route_not_available` a cualquier clave. El envío con clave llega con conversations PR #2284, sin mergear al 16-10-2026.",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "device_id",
				"apiName": "device_id",
				"location": "body",
				"required": true,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: device_id.",
				"valueType": "integer"
			},
			{
				"name": "contact_id",
				"apiName": "contact_id",
				"location": "body",
				"required": true,
				"kind": "number",
				"displayName": "ID del contacto",
				"description": "En la API: contact_id.",
				"valueType": "integer"
			},
			{
				"name": "text",
				"apiName": "text",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Texto",
				"description": "En la API: text.",
				"valueType": "string"
			},
			{
				"name": "file",
				"apiName": "file",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Archivo (URL)",
				"description": "En la API: file.",
				"valueType": "string"
			},
			{
				"name": "temporal_uuid",
				"apiName": "temporal_uuid",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "UUID temporal",
				"description": "En la API: temporal_uuid.",
				"valueType": "string"
			},
			{
				"name": "local_id",
				"apiName": "local_id",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "ID local",
				"description": "En la API: local_id.",
				"valueType": "string"
			},
			{
				"name": "note",
				"apiName": "note",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Como nota interna",
				"description": "En la API: note.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "messageReaction.update",
		"name": "Reaccionar a un mensaje",
		"description": "Usalo para reaccionar con un emoji a un mensaje de una conversación, por ejemplo para acusar recibo sin escribir una respuesta. Permiso: conversations:send.",
		"method": "PUT",
		"path": "/api/v1/contacts/{contact}/messages/{message}/reaction",
		"permission": "conversations:send",
		"notice": "El envío con clave se abre con el permiso `conversations:send` y las reglas de WhatsApp (ventana de 24 horas y frenos contra spam): está en camino. Hasta que se habilite, esta ruta responde `403 route_not_available` a cualquier clave. El envío con clave llega con conversations PR #2284, sin mergear al 16-10-2026.",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "message",
				"apiName": "message",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del mensaje",
				"description": "En la API: message.",
				"valueType": "integer"
			},
			{
				"name": "emoji",
				"apiName": "emoji",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Emoji",
				"description": "En la API: emoji.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "messageReaction.destroy",
		"name": "Quitar una reacción",
		"description": "Sirve para quitar la reacción que pusiste en un mensaje. Permiso: conversations:send.",
		"method": "DELETE",
		"path": "/api/v1/contacts/{contact}/messages/{message}/reaction",
		"permission": "conversations:send",
		"notice": "El envío con clave se abre con el permiso `conversations:send` y las reglas de WhatsApp (ventana de 24 horas y frenos contra spam): está en camino. Hasta que se habilite, esta ruta responde `403 route_not_available` a cualquier clave. El envío con clave llega con conversations PR #2284, sin mergear al 16-10-2026.",
		"source": "spec",
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "message",
				"apiName": "message",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del mensaje",
				"description": "En la API: message.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "forwardMessage.store",
		"name": "Reenviar un mensaje",
		"description": "Usalo para reenviar un mensaje de una conversación a otros contactos, eligiendo desde qué número sale cada envío; la respuesta indica el resultado por destino. Permiso: conversations:send.",
		"method": "POST",
		"path": "/api/v1/contacts/{contact}/messages/{message}/forward",
		"permission": "conversations:send",
		"notice": "El envío con clave se abre con el permiso `conversations:send` y las reglas de WhatsApp (ventana de 24 horas y frenos contra spam): está en camino. Hasta que se habilite, esta ruta responde `403 route_not_available` a cualquier clave. El envío con clave llega con conversations PR #2284, sin mergear al 16-10-2026.",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "message",
				"apiName": "message",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del mensaje",
				"description": "En la API: message.",
				"valueType": "integer"
			},
			{
				"name": "targets",
				"apiName": "targets",
				"location": "body",
				"required": true,
				"kind": "json",
				"displayName": "Destinos",
				"description": "En la API: targets."
			}
		]
	},
	{
		"resource": "conversation",
		"value": "interactiveMessage.storePoll",
		"name": "Enviar una encuesta",
		"description": "Sirve para mandarle a un contacto una encuesta con opciones, de respuesta única o múltiple, por ejemplo para relevar preferencias o confirmar un turno. Permiso: conversations:send.",
		"method": "POST",
		"path": "/api/v1/contacts/{contact}/message/poll",
		"permission": "conversations:send",
		"notice": "El envío con clave se abre con el permiso `conversations:send` y las reglas de WhatsApp (ventana de 24 horas y frenos contra spam): está en camino. Hasta que se habilite, esta ruta responde `403 route_not_available` a cualquier clave. El envío con clave llega con conversations PR #2284, sin mergear al 16-10-2026.",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "device_id",
				"apiName": "device_id",
				"location": "body",
				"required": true,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: device_id.",
				"valueType": "integer"
			},
			{
				"name": "question",
				"apiName": "question",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Pregunta",
				"description": "En la API: question.",
				"valueType": "string"
			},
			{
				"name": "options",
				"apiName": "options",
				"location": "body",
				"required": true,
				"kind": "list",
				"displayName": "Opciones",
				"description": "Separá los valores con comas. En la API: options.",
				"valueType": "string"
			},
			{
				"name": "multiple",
				"apiName": "multiple",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Respuesta múltiple",
				"description": "En la API: multiple.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "interactiveMessage.storeEvent",
		"name": "Enviar una invitación a un evento",
		"description": "Usalo para enviarle a un contacto una invitación a un evento con nombre, fecha y hora, descripción y lugar, por ejemplo un webinar o una cita. Permiso: conversations:send.",
		"method": "POST",
		"path": "/api/v1/contacts/{contact}/message/event",
		"permission": "conversations:send",
		"notice": "El envío con clave se abre con el permiso `conversations:send` y las reglas de WhatsApp (ventana de 24 horas y frenos contra spam): está en camino. Hasta que se habilite, esta ruta responde `403 route_not_available` a cualquier clave. El envío con clave llega con conversations PR #2284, sin mergear al 16-10-2026.",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "device_id",
				"apiName": "device_id",
				"location": "body",
				"required": true,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: device_id.",
				"valueType": "integer"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "date_time",
				"apiName": "date_time",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Fecha y hora",
				"description": "En la API: date_time.",
				"valueType": "string"
			},
			{
				"name": "description",
				"apiName": "description",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Descripción",
				"description": "En la API: description.",
				"valueType": "string"
			},
			{
				"name": "location",
				"apiName": "location",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Lugar",
				"description": "En la API: location.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "conversation",
		"value": "contactCard.store",
		"name": "Enviar una tarjeta de contacto",
		"description": "Sirve para compartirle a un contacto una o más tarjetas de contacto desde uno de tus números, por ejemplo para pasarle el contacto de un vendedor o de soporte. Permiso: conversations:send.",
		"method": "POST",
		"path": "/api/v1/contacts/{contact}/message/contact-card",
		"permission": "conversations:send",
		"notice": "El envío con clave se abre con el permiso `conversations:send` y las reglas de WhatsApp (ventana de 24 horas y frenos contra spam): está en camino. Hasta que se habilite, esta ruta responde `403 route_not_available` a cualquier clave. El envío con clave llega con conversations PR #2284, sin mergear al 16-10-2026.",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "contact",
				"apiName": "contact",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del contacto",
				"description": "En la API: contact.",
				"valueType": "integer"
			},
			{
				"name": "device_id",
				"apiName": "device_id",
				"location": "body",
				"required": true,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: device_id.",
				"valueType": "integer"
			},
			{
				"name": "contact_card_ids",
				"apiName": "contact_card_ids",
				"location": "body",
				"required": true,
				"kind": "list",
				"displayName": "IDs de tarjetas de contacto",
				"description": "Separá los valores con comas. En la API: contact_card_ids.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "template",
		"value": "messageTemplate.templates",
		"name": "Listar plantillas",
		"description": "Usalo para listar tus plantillas de WhatsApp con su estado de aprobación, categoría, idioma y número, y elegir cuál usar en un envío o una difusión. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/templates",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "name",
				"apiName": "name",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "uid",
				"apiName": "uid",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "UID",
				"description": "En la API: uid.",
				"valueType": "string"
			},
			{
				"name": "language_code",
				"apiName": "language_code",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Idioma",
				"description": "En la API: language_code.",
				"valueType": "string"
			},
			{
				"name": "status",
				"apiName": "status",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Estado",
				"description": "En la API: status.",
				"valueType": "string",
				"options": [
					"PENDING",
					"APPROVED",
					"REJECTED",
					"PENDING_DELETION",
					"PAUSED",
					"DISABLED",
					"ARCHIVED"
				]
			},
			{
				"name": "category",
				"apiName": "category",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Categoría",
				"description": "En la API: category.",
				"valueType": "string"
			},
			{
				"name": "deviceId",
				"apiName": "deviceId",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: deviceId.",
				"valueType": "integer"
			},
			{
				"name": "type",
				"apiName": "type",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Tipo",
				"description": "En la API: type.",
				"valueType": "string",
				"options": [
					"text",
					"image",
					"document",
					"video",
					"location",
					"default"
				]
			},
			{
				"name": "created_by_webhook",
				"apiName": "created_by_webhook",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Creada por webhook",
				"description": "En la API: created_by_webhook.",
				"valueType": "boolean"
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string",
				"options": [
					"name",
					"created_at",
					"updated_at"
				]
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string",
				"options": [
					"asc",
					"desc"
				]
			}
		]
	},
	{
		"resource": "template",
		"value": "messageTemplate.store",
		"name": "Crear una plantilla",
		"description": "Sirve para crear una plantilla de WhatsApp (encabezado, cuerpo con variables, pie y botones) desde tu sistema, sin pasar por el panel. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/templates",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "name",
				"apiName": "name",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "language_code",
				"apiName": "language_code",
				"location": "body",
				"required": true,
				"kind": "options",
				"displayName": "Idioma",
				"description": "En la API: language_code.",
				"valueType": "string",
				"options": [
					"af",
					"sq",
					"ar",
					"ar_EG",
					"ar_AE",
					"ar_LB",
					"ar_MA",
					"ar_QA",
					"az",
					"be_BY",
					"bn",
					"bn_IN",
					"bg",
					"ca",
					"zh_CN",
					"zh_HK",
					"zh_TW",
					"hr",
					"cs",
					"da",
					"prs_AF",
					"nl",
					"nl_BE",
					"en",
					"en_GB",
					"en_US",
					"en_AE",
					"en_AU",
					"en_CA",
					"en_GH",
					"en_IE",
					"en_IN",
					"en_JM",
					"en_MY",
					"en_NZ",
					"en_QA",
					"en_SG",
					"en_UG",
					"en_ZA",
					"et",
					"fil",
					"fi",
					"fr",
					"fr_BE",
					"fr_CA",
					"fr_CH",
					"fr_CI",
					"fr_MA",
					"ka",
					"de",
					"de_AT",
					"de_CH",
					"el",
					"gu",
					"ha",
					"he",
					"hi",
					"hu",
					"id",
					"ga",
					"it",
					"ja",
					"kn",
					"kk",
					"rw_RW",
					"ko",
					"ky_KG",
					"lo",
					"lv",
					"lt",
					"mk",
					"ms",
					"ml",
					"mr",
					"nb",
					"ps_AF",
					"fa",
					"pl",
					"pt_BR",
					"pt_PT",
					"pa",
					"ro",
					"ru",
					"sr",
					"si_LK",
					"sk",
					"sl",
					"es",
					"es_AR",
					"es_CL",
					"es_CO",
					"es_CR",
					"es_DO",
					"es_EC",
					"es_HN",
					"es_MX",
					"es_PA",
					"es_PE",
					"es_ES",
					"es_UY",
					"sw",
					"sv",
					"ta",
					"te",
					"th",
					"tr",
					"uk",
					"ur",
					"uz",
					"vi",
					"zu"
				]
			},
			{
				"name": "category",
				"apiName": "category",
				"location": "body",
				"required": true,
				"kind": "options",
				"displayName": "Categoría",
				"description": "En la API: category.",
				"valueType": "string",
				"options": [
					"UTILITY",
					"MARKETING",
					"AUTHENTICATION"
				]
			},
			{
				"name": "type",
				"apiName": "type",
				"location": "body",
				"required": true,
				"kind": "options",
				"displayName": "Tipo",
				"description": "En la API: type.",
				"valueType": "string",
				"options": [
					"text",
					"image",
					"document",
					"video",
					"location",
					"default"
				]
			},
			{
				"name": "body",
				"apiName": "body",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Cuerpo",
				"description": "En la API: body.",
				"valueType": "string"
			},
			{
				"name": "header",
				"apiName": "header",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Encabezado",
				"description": "En la API: header.",
				"valueType": "string"
			},
			{
				"name": "file",
				"apiName": "file",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Archivo (URL)",
				"description": "En la API: file.",
				"valueType": "string"
			},
			{
				"name": "params",
				"apiName": "params",
				"location": "body",
				"required": false,
				"kind": "list",
				"displayName": "Parámetros",
				"description": "Separá los valores con comas. En la API: params.",
				"valueType": "string"
			},
			{
				"name": "footer",
				"apiName": "footer",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Pie",
				"description": "En la API: footer.",
				"valueType": "string"
			},
			{
				"name": "buttons",
				"apiName": "buttons",
				"location": "body",
				"required": false,
				"kind": "json",
				"displayName": "Botones",
				"description": "En la API: buttons."
			}
		]
	},
	{
		"resource": "template",
		"value": "messageTemplate.template",
		"name": "Ver una plantilla",
		"description": "Sirve para ver una plantilla completa, con su estado, variables y botones, por ejemplo para saber qué valores completar al enviarla. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/templates/{template}",
		"permission": "conversations:read",
		"source": "spec",
		"params": [
			{
				"name": "template",
				"apiName": "template",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la plantilla",
				"description": "En la API: template.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "template",
		"value": "messageTemplate.update",
		"name": "Actualizar una plantilla",
		"description": "Usalo para editar el contenido de una plantilla existente: categoría, encabezado, cuerpo, variables, pie o botones. Permiso: conversations:write.",
		"method": "PUT",
		"path": "/api/v1/templates/{template}",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "template",
				"apiName": "template",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la plantilla",
				"description": "En la API: template.",
				"valueType": "integer"
			},
			{
				"name": "device_id",
				"apiName": "device_id",
				"location": "body",
				"required": true,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: device_id.",
				"valueType": "integer"
			},
			{
				"name": "category",
				"apiName": "category",
				"location": "body",
				"required": true,
				"kind": "options",
				"displayName": "Categoría",
				"description": "En la API: category.",
				"valueType": "string",
				"options": [
					"UTILITY",
					"MARKETING",
					"AUTHENTICATION"
				]
			},
			{
				"name": "type",
				"apiName": "type",
				"location": "body",
				"required": true,
				"kind": "options",
				"displayName": "Tipo",
				"description": "En la API: type.",
				"valueType": "string",
				"options": [
					"text",
					"image",
					"document",
					"video",
					"location",
					"default"
				]
			},
			{
				"name": "body",
				"apiName": "body",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Cuerpo",
				"description": "En la API: body.",
				"valueType": "string"
			},
			{
				"name": "header",
				"apiName": "header",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Encabezado",
				"description": "En la API: header.",
				"valueType": "string"
			},
			{
				"name": "file",
				"apiName": "file",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Archivo (URL)",
				"description": "En la API: file.",
				"valueType": "string"
			},
			{
				"name": "params",
				"apiName": "params",
				"location": "body",
				"required": false,
				"kind": "list",
				"displayName": "Parámetros",
				"description": "Separá los valores con comas. En la API: params.",
				"valueType": "string"
			},
			{
				"name": "footer",
				"apiName": "footer",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Pie",
				"description": "En la API: footer.",
				"valueType": "string"
			},
			{
				"name": "buttons",
				"apiName": "buttons",
				"location": "body",
				"required": false,
				"kind": "json",
				"displayName": "Botones",
				"description": "En la API: buttons."
			}
		]
	},
	{
		"resource": "template",
		"value": "messageTemplate.quickReplyButtons",
		"name": "Ver los botones de respuesta rápida de una plantilla",
		"description": "Usalo para obtener los botones de respuesta rápida de una plantilla, por ejemplo para preparar qué hacer según el botón que toque el contacto. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/templates/{template}/quick-reply-buttons",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "none",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "template",
				"apiName": "template",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la plantilla",
				"description": "En la API: template.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "template",
		"value": "messageTemplate.send",
		"name": "Enviar una plantilla",
		"description": "Sirve para enviar una plantilla desde uno de tus números a un teléfono o contacto, completando sus variables, por ejemplo un aviso, un recordatorio o una confirmación. Permiso: conversations:send.",
		"method": "POST",
		"path": "/api/v1/devices/{device}/templates/{template}/send-template",
		"permission": "conversations:send",
		"notice": "El envío con clave se abre con el permiso `conversations:send` y las reglas de WhatsApp (ventana de 24 horas y frenos contra spam): está en camino. Hasta que se habilite, esta ruta responde `403 route_not_available` a cualquier clave. El envío con clave llega con conversations PR #2284, sin mergear al 16-10-2026.",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "template",
				"apiName": "template",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la plantilla",
				"description": "En la API: template.",
				"valueType": "string"
			},
			{
				"name": "phone",
				"apiName": "phone",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Teléfono",
				"description": "En la API: phone.",
				"valueType": "string"
			},
			{
				"name": "contact_id",
				"apiName": "contact_id",
				"location": "body",
				"required": true,
				"kind": "number",
				"displayName": "ID del contacto",
				"description": "En la API: contact_id.",
				"valueType": "integer"
			},
			{
				"name": "template_variables",
				"apiName": "template_variables",
				"location": "body",
				"required": false,
				"kind": "json",
				"displayName": "Variables de la plantilla",
				"description": "En la API: template_variables."
			}
		]
	},
	{
		"resource": "template",
		"value": "messageTemplate.delete",
		"name": "Eliminar una plantilla de un número",
		"description": "Usalo para eliminar una plantilla de uno de tus números cuando ya no la vas a usar. Permiso: conversations:write.",
		"method": "DELETE",
		"path": "/api/v1/devices/{device}/templates/{template}",
		"permission": "conversations:write",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "template",
				"apiName": "template",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la plantilla",
				"description": "En la API: template.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "tag",
		"value": "tag.index",
		"name": "Listar etiquetas",
		"description": "Sirve para listar las etiquetas de la cuenta, opcionalmente con cuántos contactos tiene cada una, y obtener sus IDs para filtrar o segmentar. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/tags",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "name",
				"apiName": "name",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "withContactCount",
				"apiName": "withContactCount",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Incluir cantidad de contactos",
				"description": "En la API: withContactCount.",
				"valueType": "boolean"
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string",
				"options": [
					"name",
					"created_at",
					"updated_at"
				]
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string",
				"options": [
					"asc",
					"desc"
				]
			}
		]
	},
	{
		"resource": "tag",
		"value": "tag.store",
		"name": "Crear una etiqueta",
		"description": "Usalo para crear una etiqueta (nombre, descripción, color) y segmentar contactos según los criterios de tu negocio. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/tags",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "name",
				"apiName": "name",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "description",
				"apiName": "description",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Descripción",
				"description": "En la API: description.",
				"valueType": "string"
			},
			{
				"name": "color",
				"apiName": "color",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Color",
				"description": "En la API: color.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "tag",
		"value": "tag.show",
		"name": "Ver una etiqueta",
		"description": "Sirve para ver una etiqueta y, si lo pedís, cuántos contactos la tienen. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/tags/{tag}",
		"permission": "conversations:read",
		"source": "spec",
		"params": [
			{
				"name": "tag",
				"apiName": "tag",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la etiqueta",
				"description": "En la API: tag.",
				"valueType": "integer"
			},
			{
				"name": "withContactCount",
				"apiName": "withContactCount",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Incluir cantidad de contactos",
				"description": "En la API: withContactCount.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "tag",
		"value": "tag.update",
		"name": "Actualizar una etiqueta",
		"description": "Usalo para renombrar una etiqueta o cambiar su descripción o su color. Permiso: conversations:write.",
		"method": "PUT",
		"path": "/api/v1/tags/{tag}",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "tag",
				"apiName": "tag",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la etiqueta",
				"description": "En la API: tag.",
				"valueType": "integer"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "description",
				"apiName": "description",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Descripción",
				"description": "En la API: description.",
				"valueType": "string"
			},
			{
				"name": "color",
				"apiName": "color",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Color",
				"description": "En la API: color.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "tag",
		"value": "tag.contacts",
		"name": "Listar los contactos con una etiqueta",
		"description": "Sirve para obtener todos los contactos que tienen una etiqueta, por ejemplo para exportar un segmento o sincronizarlo con otra herramienta. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/tags/{tag}/contacts",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "tag",
				"apiName": "tag",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la etiqueta",
				"description": "En la API: tag.",
				"valueType": "integer"
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string",
				"options": [
					"name",
					"last_message_time"
				]
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string",
				"options": [
					"asc",
					"desc"
				]
			},
			{
				"name": "sortBy",
				"apiName": "sortBy",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Ordenar por",
				"description": "En la API: sortBy.",
				"valueType": "string",
				"options": [
					"asc",
					"desc"
				]
			}
		]
	},
	{
		"resource": "tag",
		"value": "tag.destroy",
		"name": "Eliminar etiquetas",
		"description": "Usalo para eliminar varias etiquetas de una vez. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/tags/delete",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "tagIds",
				"apiName": "tagIds",
				"location": "body",
				"required": true,
				"kind": "list",
				"displayName": "IDs de etiquetas",
				"description": "Separá los valores con comas. En la API: tagIds.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "customField",
		"value": "customField.index",
		"name": "Listar campos personalizados",
		"description": "Usalo para conocer los campos personalizados de la cuenta y sus IDs antes de leer o escribir esos datos en tus contactos. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/custom-fields",
		"permission": "conversations:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "name",
				"apiName": "name",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "description",
				"apiName": "description",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Descripción",
				"description": "En la API: description.",
				"valueType": "string"
			},
			{
				"name": "type",
				"apiName": "type",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "Tipo",
				"description": "En la API: type.",
				"valueType": "integer"
			},
			{
				"name": "withContactCount",
				"apiName": "withContactCount",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Incluir cantidad de contactos",
				"description": "En la API: withContactCount.",
				"valueType": "boolean"
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string",
				"options": [
					"name",
					"created_at",
					"updated_at"
				]
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string",
				"options": [
					"asc",
					"desc"
				]
			}
		]
	},
	{
		"resource": "customField",
		"value": "customField.store",
		"name": "Crear un campo personalizado",
		"description": "Sirve para crear un campo personalizado nuevo (por ejemplo «plan» o «fecha de compra») y guardar en Funnelchat datos propios de tu negocio. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/custom-fields",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "name",
				"apiName": "name",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "type",
				"apiName": "type",
				"location": "body",
				"required": true,
				"kind": "number",
				"displayName": "Tipo",
				"description": "En la API: type.",
				"valueType": "integer"
			},
			{
				"name": "description",
				"apiName": "description",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Descripción",
				"description": "En la API: description.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "customField",
		"value": "customField.destroy",
		"name": "Eliminar campos personalizados",
		"description": "Usalo para eliminar en bloque los campos personalizados que ya no usás. Permiso: conversations:write.",
		"method": "POST",
		"path": "/api/v1/custom-fields/delete",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "customFieldIds",
				"apiName": "customFieldIds",
				"location": "body",
				"required": true,
				"kind": "list",
				"displayName": "IDs de campos personalizados",
				"description": "Separá los valores con comas. En la API: customFieldIds.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "customField",
		"value": "customField.show",
		"name": "Ver un campo personalizado",
		"description": "Sirve para ver la definición de un campo personalizado: nombre, tipo, descripción y cuántos contactos lo tienen. Permiso: conversations:read.",
		"method": "GET",
		"path": "/api/v1/custom-fields/{customField}",
		"permission": "conversations:read",
		"source": "spec",
		"params": [
			{
				"name": "customField",
				"apiName": "customField",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del campo personalizado",
				"description": "En la API: customField.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "customField",
		"value": "customField.update",
		"name": "Actualizar un campo personalizado",
		"description": "Usalo para renombrar un campo personalizado o actualizar su descripción; el tipo no se cambia por acá. Permiso: conversations:write.",
		"method": "PUT",
		"path": "/api/v1/custom-fields/{customField}",
		"permission": "conversations:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "object"
		},
		"params": [
			{
				"name": "customField",
				"apiName": "customField",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del campo personalizado",
				"description": "En la API: customField.",
				"valueType": "integer"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "description",
				"apiName": "description",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Descripción",
				"description": "En la API: description.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "group",
		"value": "group.index",
		"name": "Listar grupos",
		"description": "Usalo para listar los grupos de tu cuenta con filtros por tipo, estado, número o sin campaña asignada, por ejemplo para sincronizarlos con tu sistema. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/groups",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "name",
				"apiName": "name",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string"
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string"
			},
			{
				"name": "type",
				"apiName": "type",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Tipo",
				"description": "En la API: type.",
				"valueType": "string",
				"options": [
					"1",
					"2",
					"3",
					"4"
				]
			},
			{
				"name": "status",
				"apiName": "status",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Estado",
				"description": "En la API: status.",
				"valueType": "string",
				"options": [
					"0",
					"1",
					"2",
					"3",
					"4",
					"5",
					"6",
					"7",
					"8"
				]
			},
			{
				"name": "deviceId",
				"apiName": "deviceId",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: deviceId.",
				"valueType": "integer"
			},
			{
				"name": "noCampaign",
				"apiName": "noCampaign",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Sin campaña",
				"description": "En la API: noCampaign.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "group",
		"value": "group.groups",
		"name": "Listar los grupos que administra un número",
		"description": "Sirve para ver los grupos que administra un número según lo que informa el proveedor de WhatsApp, por ejemplo para encontrar grupos que todavía no sumaste a una campaña. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/groups",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "pageSize",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "group",
		"value": "group.adGroups",
		"name": "Listar los grupos de anuncios de un número",
		"description": "Usalo para listar los grupos de anuncios que administra un número (la respuesta indica la comunidad a la que pertenecen), por ejemplo para elegir cuáles sumar a una campaña. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/ad-groups",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "pageSize",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "group",
		"value": "group.channels",
		"name": "Listar los canales de un número",
		"description": "Sirve para listar los canales de WhatsApp de un número y obtener sus identificadores. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/channels",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "pageSize",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "group",
		"value": "groupMetadata.show",
		"name": "Ver los datos actuales de un grupo en WhatsApp",
		"description": "Usalo para leer en vivo desde WhatsApp el nombre, la foto, la descripción, el link y los administradores actuales de un grupo o canal, por ejemplo para verificar que coincidan con lo esperado. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/groups/{groupUid}/metadata",
		"permission": "communities:read",
		"source": "spec",
		"params": [
			{
				"name": "groupUid",
				"apiName": "groupUid",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "UID del grupo",
				"description": "Plain string segment — not a model binding. En la API: groupUid.",
				"valueType": "string"
			},
			{
				"name": "device_id",
				"apiName": "device_id",
				"location": "query",
				"required": true,
				"kind": "number",
				"displayName": "ID del número",
				"description": "En la API: device_id.",
				"valueType": "integer"
			},
			{
				"name": "group_uid",
				"apiName": "group_uid",
				"location": "query",
				"required": true,
				"kind": "string",
				"displayName": "UID del grupo",
				"description": "En la API: group_uid.",
				"valueType": "string"
			},
			{
				"name": "type",
				"apiName": "type",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Tipo",
				"description": "En la API: type.",
				"valueType": "string",
				"options": [
					"groups",
					"ad-groups",
					"channels"
				]
			}
		]
	},
	{
		"resource": "group",
		"value": "group.show",
		"name": "Ver un grupo",
		"description": "Sirve para ver el detalle de un grupo: administradores, si el dueño está conectado, clics, link de invitación y de campaña, y si está lleno. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/groups/{group}",
		"permission": "communities:read",
		"source": "spec",
		"params": [
			{
				"name": "group",
				"apiName": "group",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del grupo",
				"description": "The group uid. En la API: group.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "group",
		"value": "group.actions",
		"name": "Listar las acciones de sesión sobre un grupo",
		"description": "Usalo para ver el historial de acciones ejecutadas sobre un grupo puntual y su resultado, por ejemplo para entender por qué cambió su nombre o sus administradores. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/groups/{group}/actions",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "group",
				"apiName": "group",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del grupo",
				"description": "The group uid. En la API: group.",
				"valueType": "string"
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string",
				"options": [
					"status",
					"created_at",
					"updated_at",
					"completed_at"
				]
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string",
				"options": [
					"asc",
					"desc"
				]
			}
		]
	},
	{
		"resource": "group",
		"value": "group.messages",
		"name": "Listar los mensajes enviados a un grupo",
		"description": "Sirve para ver los mensajes que se enviaron a un grupo y de qué envío programado salió cada uno. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/groups/{group}/messages",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "group",
				"apiName": "group",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del grupo",
				"description": "The group uid. En la API: group.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "group",
		"value": "group.scheduledMessages",
		"name": "Listar los envíos programados que incluyen un grupo",
		"description": "Usalo para saber qué envíos programados incluyen a un grupo, por ejemplo antes de hacerle cambios. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/groups/{group}/scheduled-messages",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "group",
				"apiName": "group",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del grupo",
				"description": "The group uid. En la API: group.",
				"valueType": "string"
			},
			{
				"name": "name",
				"apiName": "name",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Nombre",
				"description": "En la API: name.",
				"valueType": "string"
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string"
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "group",
		"value": "campaign.participants",
		"name": "Listar los participantes de una campaña",
		"description": "Sirve para listar los participantes de una campaña, con búsqueda por teléfono y si son administradores. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/campaigns/{campaign}/participants",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "campaign",
				"apiName": "campaign",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la campaña",
				"description": "The campaign ID. En la API: campaign.",
				"valueType": "integer"
			},
			{
				"name": "phone",
				"apiName": "phone",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Teléfono",
				"description": "En la API: phone.",
				"valueType": "string"
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string"
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string",
				"options": [
					"asc",
					"desc"
				]
			}
		]
	},
	{
		"resource": "group",
		"value": "campaign.campaignParticipants",
		"name": "Listar los participantes con su grupo actual",
		"description": "Usalo para saber en qué grupo está cada participante de una campaña, cuándo entró o salió y si sigue activo. Ideal para sincronizar miembros con tu CRM. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/campaigns/{campaign}/campaign-participants",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "campaign",
				"apiName": "campaign",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la campaña",
				"description": "The campaign ID. En la API: campaign.",
				"valueType": "integer"
			},
			{
				"name": "search",
				"apiName": "search",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Buscar",
				"description": "En la API: search.",
				"valueType": "string"
			},
			{
				"name": "status",
				"apiName": "status",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Estado",
				"description": "En la API: status.",
				"valueType": "string",
				"options": [
					"active",
					"exited"
				]
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string",
				"options": [
					"joined_at",
					"left_at"
				]
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string",
				"options": [
					"asc",
					"desc",
					"ASC",
					"DESC"
				]
			},
			{
				"name": "start_date",
				"apiName": "start_date",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Desde",
				"description": "En la API: start_date.",
				"format": "date-time"
			},
			{
				"name": "end_date",
				"apiName": "end_date",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Hasta",
				"description": "En la API: end_date.",
				"format": "date-time"
			},
			{
				"name": "timezone",
				"apiName": "timezone",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Zona horaria",
				"description": "En la API: timezone.",
				"valueType": "string"
			},
			{
				"name": "date_rule",
				"apiName": "date_rule",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Regla de fecha",
				"description": "En la API: date_rule.",
				"valueType": "integer",
				"options": [
					"1",
					"2",
					"3"
				]
			},
			{
				"name": "selection_type",
				"apiName": "selection_type",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Tipo de selección",
				"description": "En la API: selection_type.",
				"valueType": "string",
				"options": [
					"all",
					"none"
				]
			},
			{
				"name": "groups_uids",
				"apiName": "groups_uids[]",
				"location": "query",
				"required": false,
				"kind": "list",
				"displayName": "UIDs de grupos",
				"description": "Separá los valores con comas. En la API: groups_uids[].",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "group",
		"value": "campaign.participantEvents",
		"name": "Listar entradas y salidas de una campaña",
		"description": "Sirve para obtener el registro de entradas y salidas de toda una campaña, con fecha, grupo y país, filtrando por tipo de evento, fechas o grupos. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/campaigns/{campaign}/participant-events",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "campaign",
				"apiName": "campaign",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la campaña",
				"description": "The campaign ID. En la API: campaign.",
				"valueType": "integer"
			},
			{
				"name": "search",
				"apiName": "search",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Buscar",
				"description": "En la API: search.",
				"valueType": "string"
			},
			{
				"name": "event_type",
				"apiName": "event_type",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Tipo de evento",
				"description": "En la API: event_type.",
				"valueType": "string",
				"options": [
					"all",
					"join",
					"leave"
				]
			},
			{
				"name": "start_date",
				"apiName": "start_date",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Desde",
				"description": "En la API: start_date.",
				"format": "date-time"
			},
			{
				"name": "end_date",
				"apiName": "end_date",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Hasta",
				"description": "En la API: end_date.",
				"format": "date-time"
			},
			{
				"name": "timezone",
				"apiName": "timezone",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Zona horaria",
				"description": "En la API: timezone.",
				"valueType": "string"
			},
			{
				"name": "date_mode",
				"apiName": "date_mode",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Modo de fecha",
				"description": "En la API: date_mode.",
				"valueType": "string",
				"options": [
					"both",
					"joins_only",
					"leaves_only"
				]
			},
			{
				"name": "selection_type",
				"apiName": "selection_type",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Tipo de selección",
				"description": "En la API: selection_type.",
				"valueType": "string",
				"options": [
					"all",
					"none"
				]
			},
			{
				"name": "groups_uids",
				"apiName": "groups_uids[]",
				"location": "query",
				"required": false,
				"kind": "list",
				"displayName": "UIDs de grupos",
				"description": "Separá los valores con comas. En la API: groups_uids[].",
				"valueType": "string"
			},
			{
				"name": "participant_filter",
				"apiName": "participant_filter",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Filtro de participantes",
				"description": "En la API: participant_filter.",
				"valueType": "string",
				"options": [
					"all",
					"active"
				]
			}
		]
	},
	{
		"resource": "group",
		"value": "group.participants",
		"name": "Listar los participantes de un grupo",
		"description": "Usalo para listar los participantes de un grupo, filtrando por teléfono, si son administradores o si se los puede promover a administrador. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/groups/participants",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "groupUid",
				"apiName": "groupUid",
				"location": "query",
				"required": true,
				"kind": "string",
				"displayName": "UID del grupo",
				"description": "En la API: groupUid.",
				"valueType": "string"
			},
			{
				"name": "phone",
				"apiName": "phone",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Teléfono",
				"description": "En la API: phone.",
				"valueType": "string"
			},
			{
				"name": "isAdmin",
				"apiName": "isAdmin",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Es admin",
				"description": "En la API: isAdmin.",
				"valueType": "string",
				"options": [
					"true",
					"false",
					"1",
					"0"
				]
			},
			{
				"name": "eligibleForAdmin",
				"apiName": "eligibleForAdmin",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Elegible para admin",
				"description": "En la API: eligibleForAdmin.",
				"valueType": "string",
				"options": [
					"true",
					"false",
					"1",
					"0"
				]
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string"
			},
			{
				"name": "orderDirection",
				"apiName": "orderDirection",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Dirección del orden",
				"description": "En la API: orderDirection.",
				"valueType": "string",
				"options": [
					"asc",
					"desc"
				]
			}
		]
	},
	{
		"resource": "group",
		"value": "group.participantEvents",
		"name": "Listar entradas y salidas de un grupo",
		"description": "Sirve para ver quién entró y salió de un grupo puntual y cuándo, con país y filtros por fecha o tipo de evento. Permiso: communities:read.",
		"method": "GET",
		"path": "/api/v1/groups/{group}/participant-events",
		"permission": "communities:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "group",
				"apiName": "group",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del grupo",
				"description": "The group uid. En la API: group.",
				"valueType": "string"
			},
			{
				"name": "search",
				"apiName": "search",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Buscar",
				"description": "En la API: search.",
				"valueType": "string"
			},
			{
				"name": "event_type",
				"apiName": "event_type",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Tipo de evento",
				"description": "En la API: event_type.",
				"valueType": "string",
				"options": [
					"all",
					"join",
					"leave"
				]
			},
			{
				"name": "start_date",
				"apiName": "start_date",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Desde",
				"description": "En la API: start_date.",
				"format": "date-time"
			},
			{
				"name": "end_date",
				"apiName": "end_date",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Hasta",
				"description": "En la API: end_date.",
				"format": "date-time"
			},
			{
				"name": "timezone",
				"apiName": "timezone",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Zona horaria",
				"description": "En la API: timezone.",
				"valueType": "string"
			},
			{
				"name": "date_mode",
				"apiName": "date_mode",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Modo de fecha",
				"description": "En la API: date_mode.",
				"valueType": "string",
				"options": [
					"both",
					"joins_only",
					"leaves_only"
				]
			},
			{
				"name": "selection_type",
				"apiName": "selection_type",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Tipo de selección",
				"description": "En la API: selection_type.",
				"valueType": "string",
				"options": [
					"all",
					"none"
				]
			},
			{
				"name": "groups_uids",
				"apiName": "groups_uids[]",
				"location": "query",
				"required": false,
				"kind": "list",
				"displayName": "UIDs de grupos",
				"description": "Separá los valores con comas. En la API: groups_uids[].",
				"valueType": "string"
			},
			{
				"name": "participant_filter",
				"apiName": "participant_filter",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Filtro de participantes",
				"description": "En la API: participant_filter.",
				"valueType": "string",
				"options": [
					"all",
					"active"
				]
			}
		]
	},
	{
		"resource": "device",
		"value": "device.index",
		"name": "Listar números",
		"description": "Sirve para listar tus números de WhatsApp con su proveedor, si están conectados y activos y su estado de salud, y obtener los IDs que usan las demás operaciones. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices",
		"permission": "accounts:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": []
	},
	{
		"resource": "device",
		"value": "device.me",
		"name": "Ver el perfil de WhatsApp de un número",
		"description": "Usalo para leer el perfil de WhatsApp de uno de tus números tal como lo informa el proveedor. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/me",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.checkPhone",
		"name": "Verificar si un teléfono tiene WhatsApp",
		"description": "Sirve para validar si un teléfono tiene WhatsApp antes de cargarlo como contacto o escribirle, y así evitar envíos fallidos. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/check-phone",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "phone",
				"apiName": "phone",
				"location": "query",
				"required": true,
				"kind": "string",
				"displayName": "Teléfono",
				"description": "En la API: phone.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.show",
		"name": "Ver un número",
		"description": "Usalo para ver los datos de un número: alias, proveedor, WABA, nombre de usuario, si está conectado y su estado de salud. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.update",
		"name": "Actualizar un número",
		"description": "Sirve para actualizar los datos de un número (alias, color, imagen) o completar sus datos de WhatsApp Business, como WABA y phone number ID, y el consentimiento de Conversions API. Permiso: accounts:write.",
		"method": "PUT",
		"path": "/api/v1/devices/{device}",
		"permission": "accounts:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "object"
		},
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "alias",
				"apiName": "alias",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Alias",
				"description": "En la API: alias.",
				"valueType": "string"
			},
			{
				"name": "color",
				"apiName": "color",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Color",
				"description": "En la API: color.",
				"valueType": "string"
			},
			{
				"name": "image",
				"apiName": "image",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Imagen (URL)",
				"description": "En la API: image.",
				"valueType": "string"
			},
			{
				"name": "number",
				"apiName": "number",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Número",
				"description": "En la API: number.",
				"valueType": "string"
			},
			{
				"name": "first_conecction_at",
				"apiName": "first_conecction_at",
				"location": "body",
				"required": false,
				"kind": "dateTime",
				"displayName": "Primera conexión",
				"description": "En la API: first_conecction_at.",
				"format": "date-time"
			},
			{
				"name": "is_business",
				"apiName": "is_business",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Es WhatsApp Business",
				"description": "En la API: is_business.",
				"valueType": "boolean"
			},
			{
				"name": "phone_number_id",
				"apiName": "phone_number_id",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Phone number ID (Meta)",
				"description": "En la API: phone_number_id.",
				"valueType": "string"
			},
			{
				"name": "waba_id",
				"apiName": "waba_id",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "WABA ID",
				"description": "En la API: waba_id.",
				"valueType": "string"
			},
			{
				"name": "code",
				"apiName": "code",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Código",
				"description": "En la API: code.",
				"valueType": "string"
			},
			{
				"name": "whatsApp_business_app",
				"apiName": "whatsApp_business_app",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "App WhatsApp Business",
				"description": "En la API: whatsApp_business_app.",
				"valueType": "boolean"
			},
			{
				"name": "capi_consent",
				"apiName": "capi_consent",
				"location": "body",
				"required": false,
				"kind": "boolean",
				"displayName": "Consentimiento de Conversions API",
				"description": "Meta Conversions API (CAPI) opt-in consent — capi-meta-connection Inc 3 (design.md D3). Optional: only meaningful on the Meta branch, and even there it is a no-op unless the `capi` feature flag is enabled for the account (defense in depth, see updateMetaDevice below). En la API: capi_consent.",
				"valueType": "boolean"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.destroy",
		"name": "Eliminar un número",
		"description": "Usalo para dar de baja un número de la cuenta de forma definitiva. Es irreversible y requiere el permiso `accounts:operate`. Permiso: accounts:operate.",
		"method": "DELETE",
		"path": "/api/v1/devices/{device}",
		"permission": "accounts:operate",
		"notice": "Operación irreversible: pide el permiso accounts:operate.",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.reset",
		"name": "Reiniciar la sesión de un número",
		"description": "Sirve para reiniciar desde cero la sesión de WhatsApp de un número; después hay que volver a escanear el código QR. Es irreversible y requiere `accounts:operate`. Permiso: accounts:operate.",
		"method": "PUT",
		"path": "/api/v1/devices/{device}/reset",
		"permission": "accounts:operate",
		"notice": "Operación irreversible: pide el permiso accounts:operate.",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.updateWebhookReceived",
		"name": "Configurar el webhook de mensajes recibidos",
		"description": "Sirve para configurar en un número el aviso de mensajes recibidos que usa Funnelchat para recibirlos. Permiso: accounts:write.",
		"method": "PUT",
		"path": "/api/v1/devices/{device}/update-webhook-received",
		"permission": "accounts:write",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.updateWebhookReceivedAndDelivery",
		"name": "Configurar el webhook de recibidos y entregas",
		"description": "Sirve para configurar en un número los avisos de mensajes recibidos y de confirmaciones de entrega que usa Funnelchat. Permiso: accounts:write.",
		"method": "PUT",
		"path": "/api/v1/devices/{device}/update-webhook-received-and-delivery",
		"permission": "accounts:write",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.clean",
		"name": "Limpiar un número",
		"description": "Sirve para limpiar la sesión de WhatsApp de un número: después hay que volver a escanear el código QR. Es irreversible y requiere `accounts:operate`. Permiso: accounts:operate.",
		"method": "POST",
		"path": "/api/v1/devices/{device}/clean",
		"permission": "accounts:operate",
		"notice": "Operación irreversible: pide el permiso accounts:operate.",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.chats",
		"name": "Listar los chats de un número",
		"description": "Usalo para listar los chats que tiene un número en WhatsApp según el proveedor, con búsqueda por teléfono y filtro por tipo. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/chats",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "phone",
				"apiName": "phone",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Teléfono",
				"description": "En la API: phone.",
				"valueType": "string"
			},
			{
				"name": "page",
				"apiName": "page",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "page",
				"description": "En la API: page.",
				"valueType": "integer"
			},
			{
				"name": "pageSize",
				"apiName": "pageSize",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "pageSize",
				"description": "En la API: pageSize.",
				"valueType": "integer"
			},
			{
				"name": "type",
				"apiName": "type",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Tipo",
				"description": "En la API: type.",
				"valueType": "integer",
				"options": [
					"1",
					"2"
				]
			}
		]
	},
	{
		"resource": "device",
		"value": "device.openConversations",
		"name": "Ver qué teléfonos tienen conversación abierta",
		"description": "Sirve para chequear en lote, hasta 100 teléfonos por llamada, cuáles tienen una conversación abierta con un número, por ejemplo antes de decidir cómo contactarlos. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/open-conversations",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "phones",
				"apiName": "phones[]",
				"location": "query",
				"required": true,
				"kind": "list",
				"displayName": "Teléfonos",
				"description": "Separá los valores con comas. En la API: phones[].",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.messageQueue",
		"name": "Ver la cola de mensajes",
		"description": "Usalo para ver los mensajes que esperan en la cola de un número, por ejemplo para entender por qué algo todavía no salió. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/message-queue",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "page",
				"apiName": "page",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "page",
				"description": "En la API: page.",
				"valueType": "integer"
			},
			{
				"name": "pageSize",
				"apiName": "pageSize",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "pageSize",
				"description": "En la API: pageSize.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.deleteMessageQueue",
		"name": "Eliminar mensajes de la cola",
		"description": "Sirve para sacar de la cola mensajes puntuales, por su UID, antes de que se envíen, por ejemplo uno que se encoló por error. Permiso: accounts:write.",
		"method": "DELETE",
		"path": "/api/v1/devices/{device}/message-queue",
		"permission": "accounts:write",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "messageUids",
				"apiName": "messageUids[]",
				"location": "query",
				"required": true,
				"kind": "list",
				"displayName": "UIDs de mensajes",
				"description": "Separá los valores con comas. En la API: messageUids[].",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.getQueueCount",
		"name": "Contar los mensajes en la cola",
		"description": "Usalo para monitorear cuántos mensajes tiene encolados un número, por ejemplo para detectar atascos. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/message-queue/count",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.clearQueue",
		"name": "Vaciar la cola de mensajes",
		"description": "Sirve para vaciar toda la cola de un número cuando hay que frenar envíos acumulados. Descarta los mensajes sin dejar registro; es irreversible y requiere `accounts:operate`. Permiso: accounts:operate.",
		"method": "DELETE",
		"path": "/api/v1/devices/{device}/message-queue/all",
		"permission": "accounts:operate",
		"notice": "Operación irreversible: pide el permiso accounts:operate.",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.status",
		"name": "Ver el estado de conexión",
		"description": "Usalo para chequear el estado de conexión de un número, por ejemplo antes de lanzar envíos o para monitorear tus números. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/status",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "device.extensionToken",
		"name": "Pedir un token para la extensión de WhatsApp Web",
		"description": "Sirve para obtener un código de un solo uso y corta duración con el que la extensión de Chrome Z-API Conector transfiere una sesión de WhatsApp Web a este número. Solo para números Z-API. Permiso: accounts:write.",
		"method": "POST",
		"path": "/api/v1/devices/{device}/extension-token",
		"permission": "accounts:write",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceHealth.show",
		"name": "Ver la salud de un número",
		"description": "Usalo para ver la salud de un número de WhatsApp Cloud (estado, identidad, nivel de throughput e historial de cambios) a partir del último dato guardado, sin consultar a Meta. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/health",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceHealth.refresh",
		"name": "Actualizar la salud de un número",
		"description": "Sirve para pedirle a Meta la salud actualizada de un número; la respuesta indica si se refrescó de verdad o si devolvió el dato previo por la espera de 60 segundos u otra actualización en curso. Permiso: accounts:write.",
		"method": "POST",
		"path": "/api/v1/devices/{device}/health/refresh",
		"permission": "accounts:write",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceConnectionEvent.index",
		"name": "Ver el historial de conexión",
		"description": "Usalo para ver cuándo se conectó y desconectó un número, del evento más reciente al más antiguo, por ejemplo para investigar cortes. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/connection-history",
		"permission": "accounts:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "orderBy",
				"apiName": "orderBy",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Ordenar por",
				"description": "En la API: orderBy.",
				"valueType": "string"
			},
			{
				"name": "orderByMethod",
				"apiName": "orderByMethod",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Dirección del orden",
				"description": "En la API: orderByMethod.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceLogs.index",
		"name": "Listar los registros de un número",
		"description": "Usalo para depurar un número puntual: ves sus registros de actividad con método, código HTTP, duración y errores en una ventana de tiempo, del más reciente al más antiguo. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/logs",
		"permission": "accounts:read",
		"source": "spec",
		"list": {
			"pagination": "cursor",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "range",
				"apiName": "range",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Rango",
				"description": "En la API: range.",
				"valueType": "string",
				"options": [
					"1h",
					"6h",
					"24h",
					"7d",
					"30d"
				]
			},
			{
				"name": "from",
				"apiName": "from",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Desde",
				"description": "En la API: from.",
				"format": "date-time"
			},
			{
				"name": "to",
				"apiName": "to",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Hasta",
				"description": "En la API: to.",
				"format": "date-time"
			},
			{
				"name": "only_errors",
				"apiName": "only_errors",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo errores",
				"description": "En la API: only_errors.",
				"valueType": "boolean"
			},
			{
				"name": "exclude_sends",
				"apiName": "exclude_sends",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Excluir envíos",
				"description": "En la API: exclude_sends.",
				"valueType": "boolean"
			},
			{
				"name": "methods",
				"apiName": "methods[]",
				"location": "query",
				"required": false,
				"kind": "list",
				"displayName": "Métodos",
				"description": "Separá los valores con comas. En la API: methods[].",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceLogs.health",
		"name": "Ver la señal de salud de los registros",
		"description": "Sirve para hacer un chequeo rápido de un número: mira las últimas 5 peticiones que no son envíos y devuelve un veredicto (sano, revisar o atención). Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/logs/health",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceFleetLogs.index",
		"name": "Listar los registros de todos los números",
		"description": "Sirve para revisar en un solo lugar los registros de actividad de todos tus números (método, URL, código HTTP, duración, errores) en una ventana de tiempo. Ideal para diagnosticar fallas. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/logs",
		"permission": "accounts:read",
		"source": "spec",
		"list": {
			"pagination": "cursor",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "range",
				"apiName": "range",
				"location": "query",
				"required": false,
				"kind": "options",
				"displayName": "Rango",
				"description": "En la API: range.",
				"valueType": "string",
				"options": [
					"1h",
					"6h",
					"24h",
					"7d",
					"30d"
				]
			},
			{
				"name": "from",
				"apiName": "from",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Desde",
				"description": "En la API: from.",
				"format": "date-time"
			},
			{
				"name": "to",
				"apiName": "to",
				"location": "query",
				"required": false,
				"kind": "dateTime",
				"displayName": "Hasta",
				"description": "En la API: to.",
				"format": "date-time"
			},
			{
				"name": "only_errors",
				"apiName": "only_errors",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Solo errores",
				"description": "En la API: only_errors.",
				"valueType": "boolean"
			},
			{
				"name": "exclude_sends",
				"apiName": "exclude_sends",
				"location": "query",
				"required": false,
				"kind": "boolean",
				"displayName": "Excluir envíos",
				"description": "En la API: exclude_sends.",
				"valueType": "boolean"
			},
			{
				"name": "methods",
				"apiName": "methods[]",
				"location": "query",
				"required": false,
				"kind": "list",
				"displayName": "Métodos",
				"description": "Separá los valores con comas. En la API: methods[].",
				"valueType": "string"
			},
			{
				"name": "per_device_cap",
				"apiName": "per_device_cap",
				"location": "query",
				"required": false,
				"kind": "number",
				"displayName": "Tope por número",
				"description": "En la API: per_device_cap.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceUsername.show",
		"name": "Ver el nombre de usuario",
		"description": "Usalo para consultar el nombre de usuario de WhatsApp reservado para un número, tanto el que informa Meta como el guardado en Funnelchat. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/username",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceUsername.store",
		"name": "Configurar el nombre de usuario",
		"description": "Sirve para reservar en Meta un nombre de usuario de WhatsApp para uno de tus números. Permiso: accounts:write.",
		"method": "POST",
		"path": "/api/v1/devices/{device}/username",
		"permission": "accounts:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "username",
				"apiName": "username",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "Nombre de usuario",
				"description": "En la API: username.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceUsername.suggestions",
		"name": "Sugerir nombres de usuario",
		"description": "Usalo para pedirle a Meta sugerencias de nombre de usuario antes de reservar uno. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/username/suggestions",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceDisconnectSurvey.show",
		"name": "Ver la encuesta de desconexión",
		"description": "Sirve para saber si un número tiene pendiente la encuesta sobre el motivo de su desconexión. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/devices/{device}/disconnect-survey",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "device",
		"value": "deviceDisconnectSurvey.store",
		"name": "Responder la encuesta de desconexión",
		"description": "Usalo para registrar por qué se desconectó un número, respondiendo la encuesta de desconexión con uno de los motivos predefinidos. Permiso: accounts:write.",
		"method": "POST",
		"path": "/api/v1/devices/{device}/disconnect-survey",
		"permission": "accounts:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "device",
				"apiName": "device",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del número",
				"description": "The device ID. En la API: device.",
				"valueType": "integer"
			},
			{
				"name": "reason",
				"apiName": "reason",
				"location": "body",
				"required": true,
				"kind": "options",
				"displayName": "Motivo",
				"description": "En la API: reason.",
				"valueType": "integer",
				"options": [
					"1",
					"2",
					"4",
					"5"
				]
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookSubscription.index",
		"name": "Listar suscripciones de webhooks",
		"description": "Usalo para ver todas las suscripciones de la cuenta, también las que crearon otras integraciones o personas. Permiso: webhooks:read.",
		"method": "GET",
		"path": "/api/v1/webhooks",
		"permission": "webhooks:read",
		"notice": "Con una clave, además del permiso de la ruta, pide el permiso de lectura del área de cada tipo de evento de la suscripción (accounts:read, conversations:read o communities:read).",
		"source": "accounts-webhook-subscriptions",
		"list": {
			"pagination": "none",
			"maxPageSize": 100
		},
		"params": []
	},
	{
		"resource": "webhook",
		"value": "webhookSubscription.store",
		"name": "Crear una suscripción de webhook",
		"description": "Usalo para registrar una URL https y elegir los eventos que recibe. La respuesta trae el secreto una sola vez: guardalo para verificar la firma. Permiso: webhooks:write.",
		"method": "POST",
		"path": "/api/v1/webhooks",
		"permission": "webhooks:write",
		"notice": "Con una clave, además del permiso de la ruta, pide el permiso de lectura del área de cada tipo de evento de la suscripción (accounts:read, conversations:read o communities:read).",
		"source": "accounts-webhook-subscriptions",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "url",
				"apiName": "url",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "URL",
				"description": "URL `https` pública que recibe las entregas. Sin usuario ni contraseña; una dirección interna se rechaza. En la API: url.",
				"valueType": "string"
			},
			{
				"name": "events",
				"apiName": "events",
				"location": "body",
				"required": true,
				"kind": "list",
				"displayName": "Eventos",
				"description": "Tipos de evento del catálogo (`GET /api/v1/webhooks/events`) que se pueden suscribir. Con una clave, cada tipo pide el permiso de lectura de su área. Separá los valores con comas. En la API: events.",
				"valueType": "string"
			},
			{
				"name": "description",
				"apiName": "description",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Descripción",
				"description": "Texto para reconocer la suscripción en la lista. En la API: description.",
				"valueType": "string"
			},
			{
				"name": "filters",
				"apiName": "filters",
				"location": "body",
				"required": false,
				"kind": "json",
				"displayName": "Filtros",
				"description": "Filtro opcional por campañas (`campaign_ids`): con filtro, un evento sin campaña no se entrega. En la API: filters."
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookSubscription.show",
		"name": "Ver una suscripción de webhook",
		"description": "Usalo para ver la URL, los eventos, el filtro y el estado de una suscripción. Nunca trae el secreto. Permiso: webhooks:read.",
		"method": "GET",
		"path": "/api/v1/webhooks/{id}",
		"permission": "webhooks:read",
		"notice": "Con una clave, además del permiso de la ruta, pide el permiso de lectura del área de cada tipo de evento de la suscripción (accounts:read, conversations:read o communities:read).",
		"source": "accounts-webhook-subscriptions",
		"params": [
			{
				"name": "id",
				"apiName": "id",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la suscripción",
				"description": "El `id` (UUID) de la suscripción. En la API: id.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookSubscription.update",
		"name": "Actualizar una suscripción de webhook",
		"description": "Usalo para cambiar la URL (por ejemplo, cuando cambia tu túnel), los eventos, el filtro o pausar y reactivar una suscripción. Reemplaza la suscripción completa y el secreto no cambia. Permiso: webhooks:write.",
		"method": "PUT",
		"path": "/api/v1/webhooks/{id}",
		"permission": "webhooks:write",
		"notice": "Con una clave, además del permiso de la ruta, pide el permiso de lectura del área de cada tipo de evento de la suscripción (accounts:read, conversations:read o communities:read).",
		"source": "accounts-webhook-subscriptions",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "id",
				"apiName": "id",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la suscripción",
				"description": "El `id` (UUID) de la suscripción. En la API: id.",
				"valueType": "string"
			},
			{
				"name": "url",
				"apiName": "url",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "URL",
				"description": "URL `https` pública que recibe las entregas. En la API: url.",
				"valueType": "string"
			},
			{
				"name": "events",
				"apiName": "events",
				"location": "body",
				"required": true,
				"kind": "list",
				"displayName": "Eventos",
				"description": "La lista completa de tipos de evento: reemplaza a la anterior. Separá los valores con comas. En la API: events.",
				"valueType": "string"
			},
			{
				"name": "description",
				"apiName": "description",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Descripción",
				"description": "Texto para reconocer la suscripción en la lista. En la API: description.",
				"valueType": "string"
			},
			{
				"name": "filters",
				"apiName": "filters",
				"location": "body",
				"required": false,
				"kind": "json",
				"displayName": "Filtros",
				"description": "Filtro opcional por campañas (`campaign_ids`). En la API: filters."
			},
			{
				"name": "status",
				"apiName": "status",
				"location": "body",
				"required": false,
				"kind": "options",
				"displayName": "Estado",
				"description": "Pausar o reactivar la suscripción. No se puede dejar en `disabled`. En la API: status.",
				"valueType": "string",
				"options": [
					"active",
					"paused"
				]
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookSubscription.destroy",
		"name": "Eliminar una suscripción de webhook",
		"description": "Usalo para dar de baja una suscripción. Sus eventos y su historial de entregas se borran con ella. No borres las que no reconocés: pueden ser de otra integración de la cuenta. Permiso: webhooks:write.",
		"method": "DELETE",
		"path": "/api/v1/webhooks/{id}",
		"permission": "webhooks:write",
		"notice": "Operación irreversible. Con una clave, además del permiso de la ruta, pide el permiso de lectura del área de cada tipo de evento de la suscripción (accounts:read, conversations:read o communities:read).",
		"source": "accounts-webhook-subscriptions",
		"params": [
			{
				"name": "id",
				"apiName": "id",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la suscripción",
				"description": "El `id` (UUID) de la suscripción. En la API: id.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookSubscriptionDelivery.index",
		"name": "Listar las entregas de una suscripción",
		"description": "Usalo para revisar cada intento de entrega de una suscripción: estado HTTP, error y duración, lo más reciente primero. Permiso: webhooks:read.",
		"method": "GET",
		"path": "/api/v1/webhooks/{id}/deliveries",
		"permission": "webhooks:read",
		"notice": "Con una clave, además del permiso de la ruta, pide el permiso de lectura del área de cada tipo de evento de la suscripción (accounts:read, conversations:read o communities:read).",
		"source": "accounts-webhook-subscriptions",
		"list": {
			"pagination": "page",
			"sizeParam": "per_page",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "id",
				"apiName": "id",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la suscripción",
				"description": "El `id` (UUID) de la suscripción. En la API: id.",
				"valueType": "string"
			},
			{
				"name": "event_type",
				"apiName": "event_type",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "Tipo de evento",
				"description": "Solo los intentos de este tipo de evento. En la API: event_type.",
				"valueType": "string"
			},
			{
				"name": "event_id",
				"apiName": "event_id",
				"location": "query",
				"required": false,
				"kind": "string",
				"displayName": "ID del evento",
				"description": "Solo los intentos de este evento (`evt_…`). En la API: event_id.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookSubscriptionTest.test",
		"name": "Enviar un evento de prueba",
		"description": "Usalo para probar tu receptor: envía un único evento webhook.test firmado igual que uno real, sin reintentos, y lo deja en el historial. Permiso: webhooks:write.",
		"method": "POST",
		"path": "/api/v1/webhooks/{id}/test",
		"permission": "webhooks:write",
		"notice": "Con una clave, además del permiso de la ruta, pide el permiso de lectura del área de cada tipo de evento de la suscripción (accounts:read, conversations:read o communities:read).",
		"source": "accounts-webhook-subscriptions",
		"params": [
			{
				"name": "id",
				"apiName": "id",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID de la suscripción",
				"description": "El `id` (UUID) de la suscripción. En la API: id.",
				"valueType": "string"
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookEventCatalog.index",
		"name": "Listar tipos de evento",
		"description": "Usalo para conocer el catálogo de eventos de la cuenta y sus números, cuáles ya se emiten y cuáles están planificados, con un ejemplo del cuerpo de cada uno. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/webhooks/events",
		"permission": "accounts:read",
		"source": "spec",
		"list": {
			"pagination": "none",
			"maxPageSize": 100
		},
		"params": []
	},
	{
		"resource": "webhook",
		"value": "webhookEndpoint.index",
		"name": "Listar webhooks",
		"description": "Usalo para ver qué endpoints de webhooks tiene la cuenta, a qué eventos está suscripto cada uno, su estado y su salud. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/webhooks/endpoints",
		"permission": "accounts:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": []
	},
	{
		"resource": "webhook",
		"value": "webhookEndpoint.store",
		"name": "Crear un webhook",
		"description": "Sirve para que tu sistema se entere cuando un número se conecta o se desconecta, sin consultar la API. Registrá una URL HTTPS y guardá el secreto: se muestra una sola vez. Permiso: accounts:write.",
		"method": "POST",
		"path": "/api/v1/webhooks/endpoints",
		"permission": "accounts:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "url",
				"apiName": "url",
				"location": "body",
				"required": true,
				"kind": "string",
				"displayName": "URL",
				"description": "`https` obligatorio. La comprobación de a DÓNDE resuelve la hace `SsrfGuard` en el controlador: acá sólo se valida la forma. En la API: url.",
				"valueType": "string"
			},
			{
				"name": "description",
				"apiName": "description",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Descripción",
				"description": "En la API: description.",
				"valueType": "string"
			},
			{
				"name": "events",
				"apiName": "events",
				"location": "body",
				"required": false,
				"kind": "multiOptions",
				"displayName": "Eventos",
				"description": "Suscripciones iniciales, opcionales: un endpoint puede nacer sin ninguna y suscribirse después. Lo que NO puede es nacer suscripto a todo por omisión — eso sería lo contrario de \"por demanda\". En la API: events.",
				"valueType": "string",
				"options": [
					"device.disconnected",
					"device.connected",
					"billing.payment_failed",
					"billing.plan_blocked",
					"billing.upcoming_charge",
					"subscription.expiring",
					"subscription.trial_ending",
					"subscription.reactivated",
					"subscription.cancellation_confirmed",
					"subscription.dormant_ending",
					"ai_quota.low_balance",
					"ai_quota.topup_succeeded",
					"ai_quota.topup_failed",
					"mac.usage_80",
					"mac.usage_100",
					"mac.expiring",
					"account.blocked"
				]
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookEndpoint.show",
		"name": "Ver un webhook",
		"description": "Usalo para ver la configuración de un endpoint: URL, eventos, estado, motivo de desactivación y cuándo se rotó el secreto. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/webhooks/endpoints/{id}",
		"permission": "accounts:read",
		"source": "spec",
		"params": [
			{
				"name": "id",
				"apiName": "id",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del webhook",
				"description": "En la API: id.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookEndpoint.update",
		"name": "Actualizar un webhook",
		"description": "Sirve para cambiar la URL o la descripción de un endpoint, o para prenderlo y apagarlo entero sin perder sus suscripciones. Permiso: accounts:write.",
		"method": "PATCH",
		"path": "/api/v1/webhooks/endpoints/{id}",
		"permission": "accounts:write",
		"source": "spec",
		"body": {
			"required": false,
			"root": "object"
		},
		"params": [
			{
				"name": "id",
				"apiName": "id",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del webhook",
				"description": "En la API: id.",
				"valueType": "integer"
			},
			{
				"name": "url",
				"apiName": "url",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "URL",
				"description": "En la API: url.",
				"valueType": "string"
			},
			{
				"name": "description",
				"apiName": "description",
				"location": "body",
				"required": false,
				"kind": "string",
				"displayName": "Descripción",
				"description": "En la API: description.",
				"valueType": "string"
			},
			{
				"name": "status",
				"apiName": "status",
				"location": "body",
				"required": false,
				"kind": "options",
				"displayName": "Estado",
				"description": "Prender y apagar el endpoint entero, sin perder sus suscripciones ni su secreto. En la API: status.",
				"valueType": "string",
				"options": [
					"enabled",
					"disabled"
				]
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookEndpoint.destroy",
		"name": "Eliminar un webhook",
		"description": "Usalo para dar de baja un endpoint; se eliminan también sus suscripciones y su historial de entregas. Permiso: accounts:write.",
		"method": "DELETE",
		"path": "/api/v1/webhooks/endpoints/{id}",
		"permission": "accounts:write",
		"source": "spec",
		"params": [
			{
				"name": "id",
				"apiName": "id",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del webhook",
				"description": "En la API: id.",
				"valueType": "integer"
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookEndpointEvent.update",
		"name": "Elegir los eventos de un webhook",
		"description": "Sirve para definir a qué tipos de evento queda suscripto un endpoint. Permiso: accounts:write.",
		"method": "PUT",
		"path": "/api/v1/webhooks/endpoints/{id}/events",
		"permission": "accounts:write",
		"source": "spec",
		"body": {
			"required": true,
			"root": "object"
		},
		"params": [
			{
				"name": "id",
				"apiName": "id",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del webhook",
				"description": "En la API: id.",
				"valueType": "integer"
			},
			{
				"name": "events",
				"apiName": "events",
				"location": "body",
				"required": true,
				"kind": "json",
				"displayName": "Eventos",
				"description": "En la API: events."
			}
		]
	},
	{
		"resource": "webhook",
		"value": "webhookDelivery.index",
		"name": "Listar entregas de un webhook",
		"description": "Sirve para depurar un endpoint de webhooks: ves cada intento de entrega, del más reciente al más antiguo. Permiso: accounts:read.",
		"method": "GET",
		"path": "/api/v1/webhooks/endpoints/{id}/deliveries",
		"permission": "accounts:read",
		"source": "spec",
		"list": {
			"pagination": "page",
			"sizeParam": "perPage",
			"maxPageSize": 100
		},
		"params": [
			{
				"name": "id",
				"apiName": "id",
				"location": "path",
				"required": true,
				"kind": "string",
				"displayName": "ID del webhook",
				"description": "En la API: id.",
				"valueType": "integer"
			}
		]
	}
];
