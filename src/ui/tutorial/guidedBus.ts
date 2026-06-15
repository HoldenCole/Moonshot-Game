// A tiny pub/sub for guided-tutorial actions that originate in local component
// state (e.g. picking a founder archetype on the new-game screen, which never
// touches the game store). State-derived actions — founding, advancing a week,
// closing a round, committing a signature — are detected by the driver straight
// from the store, so they don't go through here.

type Listener = (action: string) => void;

const listeners = new Set<Listener>();

/** Fire a guided action so the driver can advance the matching beat. */
export function emitGuided(action: string): void {
  for (const l of listeners) l(action);
}

/** Subscribe to guided actions; returns an unsubscribe fn. */
export function onGuided(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
