/** One event type of the trigger's built-in list, which `scripts/generate.mjs` writes to `generated/events.ts`. */
export interface CatalogEvent {
	type: string;
	/** Area of the event: its read permission (`<area>:read`) is what a key needs to subscribe to it. */
	area: string;
	/** `active` is emitted today; `planned` can be subscribed to but is not emitted yet. */
	status: string;
	label: string;
	description: string;
}
