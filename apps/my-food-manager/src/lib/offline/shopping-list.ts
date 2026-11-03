import { getOutbox } from "./outbox-client";

/** Turns "Comprar" on for each ingredient; `stored` is what the saved pantry already has on the list. */
export function addToShoppingList(ids: readonly string[], stored: readonly string[]) {
  const outbox = getOutbox();
  for (const id of ids) void outbox.enqueue("pantry.setBuy", id, true, stored.includes(id));
}
