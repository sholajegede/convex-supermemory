import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Field, TextInput, Button, Empty, Chip } from "./ui";
import { withLog } from "../lib/logStore";

type SearchResult = {
  documentId: string;
  title: string | null;
  score: number;
  summary: string | null;
  content: string | null;
  chunks: Array<{ content: string; score: number; position: number; isRelevant: boolean }>;
};

const SUGGESTIONS = [
  "how does this user like responses formatted?",
  "what plan are they on?",
  "anything about timezone?",
];

export function SearchPanel(props: { userId: string }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [meta, setMeta] = useState<{ total: number; timing?: number } | null>(null);

  const recall = useAction(api.example.recall);

  async function submit(query: string) {
    if (!query) return;
    setBusy(true);
    setError(null);
    try {
      const res = await withLog(`search("${query}")`, () => recall({ userId: props.userId, query }));
      setResults(res.results);
      setMeta({ total: res.total, timing: res.timing });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Semantic search"
      description="search() — proxies Supermemory's hybrid RAG + memory search live, never cached locally."
    >
      <Field label="Query">
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="how does this user like responses formatted?"
          onKeyDown={(e) => e.key === "Enter" && submit(q)}
        />
      </Field>
      <div className="chip-row">
        {SUGGESTIONS.map((s) => (
          <Chip key={s} onClick={() => setQ(s)}>
            {s}
          </Chip>
        ))}
      </div>
      <Button onClick={() => submit(q)} disabled={busy || !q}>
        {busy ? "Searching…" : "Search"}
      </Button>
      {error && <div className="error-text">{error}</div>}

      {meta && (
        <div className="search-meta">
          {meta.total} result{meta.total === 1 ? "" : "s"} in {props.userId}
          {meta.timing !== undefined && <> · {meta.timing}ms</>}
        </div>
      )}

      {results && (
        <ul className="item-list" style={{ marginTop: "0.75rem" }}>
          {results.length === 0 && (
            <Empty>
              No matches yet. Freshly ingested content can take a short while to become searchable —
              try Refresh on the Documents tab, then search again.
            </Empty>
          )}
          {results.map((r, i) => (
            <li key={`${r.documentId}-${i}`} className="item">
              <div className="item-top">
                <span>{r.title ?? r.documentId}</span>
                <span className="mono">{r.score.toFixed(3)}</span>
              </div>
              {r.summary && <div className="item-io">{r.summary}</div>}
              {r.chunks?.length > 0 && (
                <div className="item-io">
                  {r.chunks.slice(0, 2).map((c, j) => (
                    <div key={j}>· {c.content}</div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
