import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Field, TextInput, Button, Badge, Empty, Chip } from "./ui";
import { withLog } from "../lib/logStore";

const SUGGESTIONS = [
  "Prefers dark mode and terse responses",
  "On the Pro plan since March",
  "Timezone is WAT (UTC+1)",
  "Never wants marketing emails",
];

export function MemoryPanel(props: { userId: string }) {
  const [fact, setFact] = useState("");
  const [isStatic, setIsStatic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgettingId, setForgettingId] = useState<string | null>(null);

  const remember = useAction(api.example.remember);
  const forget = useAction(api.example.forget);
  const memories = useQuery(api.example.listMemories, { userId: props.userId });

  async function submit(content: string) {
    if (!content) return;
    setBusy(true);
    setError(null);
    try {
      await withLog(`addMemory(${props.userId})`, () =>
        remember({ userId: props.userId, fact: content, isStatic }),
      );
      setFact("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleForget(memoryId: string) {
    setForgettingId(memoryId);
    setError(null);
    try {
      await withLog(`forgetMemory(${memoryId})`, () => forget({ userId: props.userId, memoryId }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setForgettingId(null);
    }
  }

  return (
    <>
      <Card
        title="Remember a fact"
        description="addMemory() — fast path, no chunking pipeline, usable in search immediately."
      >
        <Field label="Fact">
          <TextInput
            value={fact}
            onChange={(e) => setFact(e.target.value)}
            placeholder="Prefers dark mode and terse responses"
            onKeyDown={(e) => e.key === "Enter" && submit(fact)}
          />
        </Field>
        <div className="chip-row">
          {SUGGESTIONS.map((s) => (
            <Chip key={s} onClick={() => setFact(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={isStatic} onChange={(e) => setIsStatic(e.target.checked)} />
          Long-term fact (isStatic)
        </label>
        <Button onClick={() => submit(fact)} disabled={busy || !fact}>
          {busy ? "Saving…" : "Save memory"}
        </Button>
        {error && <div className="error-text">{error}</div>}
      </Card>

      <Card title="Memories" description={`Reactive — live for containerTag "${props.userId}".`}>
        {!memories ? (
          <Empty>Loading…</Empty>
        ) : memories.length === 0 ? (
          <Empty>No memories yet — add one above, or try a suggestion chip.</Empty>
        ) : (
          <ul className="item-list">
            {memories.map((m) => (
              <li key={m.memoryId} className="item">
                <div className="item-top">
                  <span>{m.content}</span>
                  {m.forgotten ? (
                    <Badge tone="bad">forgotten</Badge>
                  ) : m.isStatic ? (
                    <Badge tone="good">static</Badge>
                  ) : (
                    <Badge>transient</Badge>
                  )}
                </div>
                <div className="item-meta">
                  <span className="mono">{m.memoryId}</span>
                  {!m.forgotten && (
                    <Button
                      variant="secondary"
                      onClick={() => handleForget(m.memoryId)}
                      disabled={forgettingId === m.memoryId}
                    >
                      {forgettingId === m.memoryId ? "Forgetting…" : "Forget"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
