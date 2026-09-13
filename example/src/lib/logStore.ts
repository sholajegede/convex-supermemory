export type LogEntry = {
  id: number;
  title: string;
  detail?: string;
  ok: boolean;
  at: number;
};

let entries: LogEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEntries(): LogEntry[] {
  return entries;
}

function publish(entry: LogEntry) {
  entries = [...entries, entry];
  for (const listener of listeners) listener();
}

/** Run an async call, logging its start/success/failure to the Activity console. */
export async function withLog<T>(title: string, fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    const detail =
      result === undefined || result === null
        ? undefined
        : typeof result === "string"
          ? result
          : JSON.stringify(result);
    publish({ id: nextId++, title, detail, ok: true, at: Date.now() });
    return result;
  } catch (err) {
    publish({
      id: nextId++,
      title,
      detail: err instanceof Error ? err.message : String(err),
      ok: false,
      at: Date.now(),
    });
    throw err;
  }
}
