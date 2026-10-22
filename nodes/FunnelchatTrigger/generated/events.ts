// Generado por scripts/generate.mjs a partir de spec/eventos-webhooks.json.
// No editar a mano: reemplazá el catálogo copiado y corré `npm run generate`.
// Catálogo: sha256 c3da43bf6e9368e562249e3ee82450a15b8f974b6dd36b476aecd57c8ebfa7e4.

import type { CatalogEvent } from '../catalogTypes';

export const EVENT_CATALOG: CatalogEvent[] = [
	{
		"type": "device.disconnected",
		"area": "accounts",
		"status": "active",
		"label": "Número desconectado",
		"description": "Uno de los números de WhatsApp de la cuenta se desconectó y dejó de poder enviar o recibir."
	},
	{
		"type": "device.connected",
		"area": "accounts",
		"status": "active",
		"label": "Número conectado",
		"description": "Uno de los números de WhatsApp de la cuenta quedó conectado: al escanear el código QR o al terminar el alta de un número de WhatsApp Cloud."
	},
	{
		"type": "billing.payment_failed",
		"area": "accounts",
		"status": "active",
		"label": "Pago fallido",
		"description": "Un cobro de la suscripción no pudo procesarse (solo suscripciones de Stripe). Se emite una vez por factura (el primer intento fallido); no se repite en los reintentos de cobro."
	},
	{
		"type": "billing.plan_blocked",
		"area": "accounts",
		"status": "planned",
		"label": "Plan bloqueado",
		"description": "El plan quedó bloqueado por un cobro no procesado."
	},
	{
		"type": "billing.upcoming_charge",
		"area": "accounts",
		"status": "active",
		"label": "Próximo cobro",
		"description": "Se acerca el próximo cobro de la suscripción (solo suscripciones de Stripe); el aviso llega unos días antes de la fecha de cobro."
	},
	{
		"type": "subscription.expiring",
		"area": "accounts",
		"status": "planned",
		"label": "Suscripción por vencer",
		"description": "La suscripción está próxima a vencer."
	},
	{
		"type": "subscription.trial_ending",
		"area": "accounts",
		"status": "active",
		"label": "Trial por terminar",
		"description": "El período de prueba está por terminar; el aviso llega entre 1 y 3 días antes del final, según cómo se contrató (en las suscripciones de Stripe, el aviso de Stripe)."
	},
	{
		"type": "subscription.reactivated",
		"area": "accounts",
		"status": "active",
		"label": "Suscripción reactivada",
		"description": "Se revirtió la cancelación programada de la suscripción (solo suscripciones de Stripe): sigue vigente y se renueva en la fecha indicada."
	},
	{
		"type": "subscription.cancellation_confirmed",
		"area": "accounts",
		"status": "active",
		"label": "Cancelación confirmada",
		"description": "Quedó confirmada la cancelación de la suscripción (solo suscripciones de Stripe): se conserva el acceso hasta la fecha indicada."
	},
	{
		"type": "subscription.dormant_ending",
		"area": "accounts",
		"status": "active",
		"label": "Período dormido por terminar",
		"description": "El período de cuenta en reposo está por terminar (el aviso llega unos 7 días antes); en esa fecha se intenta el cobro indicado."
	},
	{
		"type": "ai_quota.low_balance",
		"area": "accounts",
		"status": "planned",
		"label": "Cuota de IA baja",
		"description": "La cuota de mensajes de IA de la cuenta está por agotarse."
	},
	{
		"type": "ai_quota.topup_succeeded",
		"area": "accounts",
		"status": "planned",
		"label": "Recarga de IA exitosa",
		"description": "Una recarga de cuota de IA se acreditó correctamente."
	},
	{
		"type": "ai_quota.topup_failed",
		"area": "accounts",
		"status": "planned",
		"label": "Recarga de IA fallida",
		"description": "Una recarga de cuota de IA no pudo procesarse."
	},
	{
		"type": "mac.usage_80",
		"area": "accounts",
		"status": "active",
		"label": "Contactos activos al 80%",
		"description": "La cuenta alcanzó el 80% de sus contactos activos mensuales del ciclo."
	},
	{
		"type": "mac.usage_100",
		"area": "accounts",
		"status": "active",
		"label": "Contactos activos al 100%",
		"description": "La cuenta agotó sus contactos activos mensuales del ciclo; se abre una gracia de 24 horas cuyo vencimiento viaja en grace_expires_at."
	},
	{
		"type": "mac.expiring",
		"area": "accounts",
		"status": "active",
		"label": "Contactos activos por expirar",
		"description": "Hay contactos activos mensuales que vencen en los próximos 7 días."
	},
	{
		"type": "account.blocked",
		"area": "accounts",
		"status": "active",
		"label": "Cuenta bloqueada",
		"description": "La cuenta quedó bloqueada por consumo: terminó la gracia de 24 horas tras agotar los contactos activos mensuales sin que se regularizara."
	},
	{
		"type": "message.received",
		"area": "conversations",
		"status": "active",
		"label": "Mensaje recibido",
		"description": "Un contacto le escribió a un número de WhatsApp de la cuenta. device_id identifica ese número y puede venir null."
	},
	{
		"type": "flow.completed",
		"area": "conversations",
		"status": "active",
		"label": "Flujo completado",
		"description": "Un contacto terminó un flujo de automatización."
	},
	{
		"type": "broadcast.finished",
		"area": "conversations",
		"status": "active",
		"label": "Campaña finalizada",
		"description": "Una campaña llegó a su estado final (enviada, fallida o con fallos parciales), con sus conteos."
	},
	{
		"type": "contact.stage_changed",
		"area": "conversations",
		"status": "active",
		"label": "Contacto cambió de etapa",
		"description": "Un contacto cambió de etapa en un tablero."
	},
	{
		"type": "message.status_changed",
		"area": "conversations",
		"status": "active",
		"label": "Estado de mensaje cambiado",
		"description": "Cambió el estado de entrega de un mensaje enviado: status es sent, delivered, read o failed."
	},
	{
		"type": "conversation.closed",
		"area": "conversations",
		"status": "active",
		"label": "Conversación cerrada",
		"description": "Se cerró la conversación con un contacto."
	},
	{
		"type": "conversation.assigned",
		"area": "conversations",
		"status": "active",
		"label": "Conversación asignada",
		"description": "Se asignó la conversación con un contacto a una persona o a la IA."
	},
	{
		"type": "contact.tag_added",
		"area": "conversations",
		"status": "active",
		"label": "Etiqueta agregada a un contacto",
		"description": "Se agregó una etiqueta a un contacto."
	},
	{
		"type": "broadcast.paused",
		"area": "conversations",
		"status": "active",
		"label": "Campaña pausada",
		"description": "Una campaña se pausó por calidad del número."
	},
	{
		"type": "contact.tag_removed",
		"area": "conversations",
		"status": "active",
		"label": "Etiqueta quitada de un contacto",
		"description": "Se quitó una etiqueta de un contacto."
	},
	{
		"type": "contact.created",
		"area": "conversations",
		"status": "active",
		"label": "Contacto creado",
		"description": "Se creó un contacto."
	},
	{
		"type": "template.status_changed",
		"area": "conversations",
		"status": "active",
		"label": "Plantilla cambió de estado",
		"description": "Cambió el estado de una plantilla de WhatsApp."
	},
	{
		"type": "flow.failed",
		"area": "conversations",
		"status": "active",
		"label": "Flujo fallido",
		"description": "Un flujo de automatización falló."
	},
	{
		"type": "whatsapp_form.completed",
		"area": "conversations",
		"status": "active",
		"label": "Formulario de WhatsApp completado",
		"description": "Un contacto completó un formulario de WhatsApp que se le envió desde un número de la cuenta."
	},
	{
		"type": "group.created",
		"area": "communities",
		"status": "active",
		"label": "Grupo creado",
		"description": "Se creó un grupo de una campaña."
	},
	{
		"type": "group.invite_link_down",
		"area": "communities",
		"status": "active",
		"label": "Link de invitación caído",
		"description": "El link de invitación de un grupo dejó de funcionar."
	},
	{
		"type": "group.invite_link_renewed",
		"area": "communities",
		"status": "active",
		"label": "Link de invitación renovado",
		"description": "Se renovó el link de invitación de un grupo."
	},
	{
		"type": "group_participant.joined",
		"area": "communities",
		"status": "active",
		"label": "Participante se unió",
		"description": "Una persona entró a un grupo."
	},
	{
		"type": "group_participant.left",
		"area": "communities",
		"status": "active",
		"label": "Participante salió",
		"description": "Una persona salió de un grupo."
	},
	{
		"type": "scheduled_message.group_delivery_failed",
		"area": "communities",
		"status": "active",
		"label": "Mensaje programado no entregado a un grupo",
		"description": "Un mensaje programado no pudo entregarse a un grupo. Reemplaza la alerta «mensaje fallido» de las campañas y avisa en más casos."
	},
	{
		"type": "scheduled_message.response_received",
		"area": "communities",
		"status": "active",
		"label": "Respuesta a un mensaje programado",
		"description": "Se recibió una respuesta a un mensaje programado."
	},
	{
		"type": "poll.voted",
		"area": "communities",
		"status": "active",
		"label": "Voto en una encuesta",
		"description": "Alguien votó en una encuesta enviada a un grupo."
	},
	{
		"type": "pipeline.finished",
		"area": "communities",
		"status": "active",
		"label": "Pipeline finalizado",
		"description": "Terminó la ejecución de un pipeline de una campaña."
	},
	{
		"type": "group.blocked",
		"area": "communities",
		"status": "active",
		"label": "Grupo bloqueado",
		"description": "Un grupo de una campaña quedó bloqueado y no puede usarse."
	},
	{
		"type": "group.recovered",
		"area": "communities",
		"status": "active",
		"label": "Grupo recuperado",
		"description": "Un grupo que estaba bloqueado volvió a estar disponible."
	},
	{
		"type": "campaign.status_changed",
		"area": "communities",
		"status": "active",
		"label": "Cambio de estado de campaña",
		"description": "Una campaña cambió de estado."
	},
	{
		"type": "scheduled_message.finished",
		"area": "communities",
		"status": "active",
		"label": "Mensaje programado finalizado",
		"description": "Terminó el envío de un mensaje programado a sus grupos, con su resultado y el conteo de grupos con fallas."
	},
	{
		"type": "group_action.failed",
		"area": "communities",
		"status": "active",
		"label": "Acción sobre un grupo fallida",
		"description": "Una acción sobre un grupo falló entera (si terminó con resultados por persona, llega group_action.completed)."
	},
	{
		"type": "daily_report.generated",
		"area": "communities",
		"status": "active",
		"label": "Reporte diario generado",
		"description": "Se generó el reporte diario de la cuenta (clics, ingresos y salidas)."
	},
	{
		"type": "campaign.no_groups_available",
		"area": "communities",
		"status": "active",
		"label": "Campaña sin grupos disponibles",
		"description": "Una campaña no tiene grupos a los que dirigir a las personas que entran por su link."
	},
	{
		"type": "group.full",
		"area": "communities",
		"status": "active",
		"label": "Grupo lleno",
		"description": "Un grupo pasó de no estar lleno a estarlo."
	},
	{
		"type": "group_action.completed",
		"area": "communities",
		"status": "active",
		"label": "Acción sobre un grupo completada",
		"description": "Terminó una acción sobre un grupo. action.uuid es el mismo action_id que devolvió la API al pedirla, y action.type dice qué acción fue."
	},
	{
		"type": "group.message_received",
		"area": "communities",
		"status": "active",
		"label": "Mensaje recibido en un grupo",
		"description": "Una persona escribió un mensaje en un grupo."
	},
	{
		"type": "group.reaction_added",
		"area": "communities",
		"status": "active",
		"label": "Reacción en un grupo",
		"description": "Una persona reaccionó a un mensaje de un grupo."
	},
	{
		"type": "group_join_request.created",
		"area": "communities",
		"status": "active",
		"label": "Solicitud para unirse a un grupo",
		"description": "Una persona pidió unirse a un grupo oficial que pide aprobación para entrar, y su solicitud quedó pendiente."
	},
	{
		"type": "group_join_request.revoked",
		"area": "communities",
		"status": "active",
		"label": "Solicitud para unirse retirada",
		"description": "Una persona retiró su solicitud pendiente para unirse a un grupo antes de que se aprobara o rechazara. Trae los mismos campos que group_join_request.created."
	}
];
