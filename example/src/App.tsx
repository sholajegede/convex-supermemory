import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import "./App.css";

export default function App() {
  const [userId] = useState("user_demo");
  const [fact, setFact] = useState("");

  const remember = useAction(api.example.remember);
  const memories = useQuery(api.example.listMemories, { userId });

  async function saveFact() {
    if (!fact) return;
    await remember({ userId, fact });
    setFact("");
  }

  return (
    <main className="app">
      <h1>convex-supermemory</h1>
      <p>Give your Convex app long-term, semantically searchable memory.</p>

      <label>
        Remember something
        <input
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          placeholder="Prefers dark mode"
        />
      </label>
      <button onClick={saveFact} disabled={!fact}>
        Save memory
      </button>

      <ul>
        {memories?.map((m) => (
          <li key={m.memoryId}>{m.content}</li>
        ))}
      </ul>
    </main>
  );
}
