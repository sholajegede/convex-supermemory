import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Field, TextArea, TextInput, Button, Badge, Empty, Chip } from "./ui";
import { withLog } from "../lib/logStore";

const STATUS_TONE: Record<string, "neutral" | "good" | "bad" | "pending"> = {
  done: "good",
  failed: "bad",
  queued: "pending",
  extracting: "pending",
  chunking: "pending",
  embedding: "pending",
  indexing: "pending",
  unknown: "neutral",
};

const SUGGESTIONS = [
  {
    label: "Support transcript",
    content:
      "Customer: My export keeps timing out on large workspaces.\nAgent: Confirmed — exports over 50k rows now stream in batches instead of one request.",
  },
  {
    label: "Product changelog",
    content:
      "v2.4: containerTag scoping is now enforced on every write, not just search. Existing data is unaffected.",
  },
];

export function DocumentPanel(props: { userId: string }) {
  const [content, setContent] = useState("");
  const [customId, setCustomId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const ingest = useAction(api.example.ingest);
  const refresh = useAction(api.example.refresh);
  const removeDocument = useAction(api.example.removeDocument);
  const documents = useQuery(api.example.listDocuments, { userId: props.userId });

  async function submit() {
    if (!content) return;
    setBusy(true);
    setError(null);
    try {
      await withLog(`addDocument(${props.userId})`, () =>
        ingest({ userId: props.userId, content, customId: customId || undefined }),
      );
      setContent("");
      setCustomId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh(documentId: string) {
    setActingId(documentId);
    setError(null);
    try {
      await withLog(`refreshDocument(${documentId})`, () => refresh({ documentId }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  }

  async function handleDelete(documentId: string) {
    setActingId(documentId);
    setError(null);
    try {
      await withLog(`deleteDocument(${documentId})`, () => removeDocument({ documentId }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingId(null);
    }
  }

  return (
    <>
      <Card
        title="Ingest a document"
        description="addDocument() — larger content, chunked and embedded asynchronously. Refresh to poll status."
      >
        <Field label="Content">
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste a support transcript, a page of docs, a whole conversation…"
            rows={4}
          />
        </Field>
        <div className="chip-row">
          {SUGGESTIONS.map((s) => (
            <Chip key={s.label} onClick={() => setContent(s.content)}>
              {s.label}
            </Chip>
          ))}
        </div>
        <Field label="Custom ID (optional)">
          <TextInput value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="ticket_1042" />
        </Field>
        <Button onClick={submit} disabled={busy || !content}>
          {busy ? "Ingesting…" : "Ingest document"}
        </Button>
        {error && <div className="error-text">{error}</div>}
      </Card>

      <Card
        title="Documents"
        description={`Reactive — live for containerTag "${props.userId}". Status updates only when you hit Refresh.`}
      >
        {!documents ? (
          <Empty>Loading…</Empty>
        ) : documents.length === 0 ? (
          <Empty>No documents yet — ingest one above.</Empty>
        ) : (
          <ul className="item-list">
            {documents.map((d) => (
              <li key={d.documentId} className="item">
                <div className="item-top">
                  <span>{d.title ?? d.customId ?? d.documentId}</span>
                  <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>{d.status}</Badge>
                </div>
                {d.summary && <div className="item-io">{d.summary}</div>}
                <div className="item-meta">
                  <span className="mono">{d.documentId}</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button
                      variant="secondary"
                      onClick={() => handleRefresh(d.documentId)}
                      disabled={actingId === d.documentId}
                    >
                      {actingId === d.documentId ? "…" : "Refresh"}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(d.documentId)}
                      disabled={actingId === d.documentId}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
