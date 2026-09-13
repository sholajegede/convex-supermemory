import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Badge, Button, Empty } from "./ui";
import { formatTime, truncate } from "../lib/format";
import { withLog } from "../lib/logStore";

type HistoryRow =
  | { kind: "memory"; key: string; containerTag: string; content: string; createdAt: number; isStatic: boolean; forgotten: boolean }
  | { kind: "document"; key: string; containerTag: string; content: string; createdAt: number; status: string; title?: string };

export function History() {
  const memories = useQuery(api.example.listRecentMemories);
  const documents = useQuery(api.example.listRecentDocuments);

  if (memories === undefined || documents === undefined) {
    return (
      <Card title="History" description="Everything ever written, across every containerTag.">
        <Empty>Loading…</Empty>
      </Card>
    );
  }

  const rows: HistoryRow[] = [
    ...memories.map((m) => ({
      kind: "memory" as const,
      key: `mem-${m.memoryId}`,
      containerTag: m.containerTag,
      content: m.content,
      createdAt: m.createdAt,
      isStatic: m.isStatic,
      forgotten: m.forgotten,
    })),
    ...documents.map((d) => ({
      kind: "document" as const,
      key: `doc-${d.documentId}`,
      containerTag: d.containerTag,
      content: d.content ?? d.title ?? d.documentId,
      createdAt: d.createdAt,
      status: d.status,
      title: d.title,
    })),
  ].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Card
      title="History"
      description="Every memory and document ever written in this deployment, newest first, across every containerTag — independent of which chip is selected above. Click a row to expand it, or recreate one to see it happen live."
    >
      {rows.length === 0 ? (
        <Empty>Nothing recorded yet — try Memories or Documents.</Empty>
      ) : (
        <ul className="item-list">
          {rows.map((row) => (
            <HistoryItem key={row.key} row={row} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function HistoryItem(props: { row: HistoryRow }) {
  const { row } = props;
  const [expanded, setExpanded] = useState(false);
  const [recreating, setRecreating] = useState(false);
  const remember = useAction(api.example.remember);
  const ingest = useAction(api.example.ingest);

  async function recreate() {
    setRecreating(true);
    try {
      if (row.kind === "memory") {
        await withLog(`recreate: addMemory(${row.containerTag})`, () =>
          remember({ userId: row.containerTag, fact: row.content, isStatic: row.isStatic }),
        );
      } else {
        await withLog(`recreate: addDocument(${row.containerTag})`, () =>
          ingest({ userId: row.containerTag, content: row.content }),
        );
      }
    } finally {
      setRecreating(false);
    }
  }

  return (
    <li className="item history-item">
      <div className="item-top history-toggle" onClick={() => setExpanded((v) => !v)}>
        <span>
          <span className="history-caret">{expanded ? "▾" : "▸"}</span>{" "}
          <Badge tone={row.kind === "memory" ? "good" : "neutral"}>{row.kind}</Badge>{" "}
          {truncate(row.content, 70)}
        </span>
        <span className="mono">{formatTime(row.createdAt)}</span>
      </div>
      {expanded && (
        <div className="history-detail">
          <div className="item-io">{row.content}</div>
          <div className="item-meta">
            <span className="mono">
              containerTag: {row.containerTag}
              {row.kind === "document" && <> · status: {row.status}</>}
              {row.kind === "memory" && row.forgotten && <> · forgotten</>}
            </span>
            <Button variant="secondary" onClick={recreate} disabled={recreating}>
              {recreating ? "Recreating…" : "🔁 Recreate live"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
