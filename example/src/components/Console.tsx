import { useEffect, useRef, useSyncExternalStore } from "react";
import { subscribe, getEntries } from "../lib/logStore";
import { formatTime } from "../lib/format";

export function Console() {
  const entries = useSyncExternalStore(subscribe, getEntries);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <aside className="console">
      <div className="console-header">
        <h3>Activity</h3>
        <p>Every call this app makes into the Supermemory client, live.</p>
      </div>
      <div className="console-log" ref={logRef}>
        {entries.length === 0 && <div className="empty">Nothing yet — try Memories, Documents, or Search.</div>}
        {entries.map((e) => (
          <div key={e.id} className={`log-entry ${e.ok ? "ok" : "err"}`}>
            <div className="log-top">
              <span>{formatTime(e.at)}</span>
              <span>{e.ok ? "ok" : "error"}</span>
            </div>
            <div className="log-title">{e.title}</div>
            {e.detail && <div className="log-detail">{e.detail}</div>}
          </div>
        ))}
      </div>
    </aside>
  );
}
