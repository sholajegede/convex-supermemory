import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Corners, Chip } from "./ui";

export type Tab = "memories" | "documents" | "search" | "history";

function FlowDiagram() {
  return (
    <div>
      <div
        className="flow"
        aria-label="your app talks to Convex, which talks to Supermemory over REST and mirrors state back reactively"
      >
        <span className="flow-node">your app</span>
        <span className="flow-arrow">⇄</span>
        <span className="flow-node hub">Convex</span>
        <span className="flow-arrow">⇄</span>
        <span className="flow-node accent">supermemory</span>
      </div>
      <p className="flow-caption">
        addMemory / addDocument / search run as Convex actions that call Supermemory over REST —
        your app never calls Supermemory directly. Reads come back reactively from Convex's own
        mirrored tables.
      </p>
    </div>
  );
}

const DEMO_USERS = ["user_demo", "user_alex", "user_team"];

export function Header(props: {
  tab: Tab;
  onTab: (t: Tab) => void;
  userId: string;
  onUserId: (u: string) => void;
}) {
  const stats = useQuery(api.example.getStats);

  return (
    <div className="hero-frame">
      <Corners />
      <div className="hero-stats">
        <span>
          <strong>{stats?.memories ?? "…"}</strong> memories
        </span>
        <span className="dot">·</span>
        <span>
          <strong>{stats?.documents ?? "…"}</strong> documents
        </span>
        <span className="dot">·</span>
        <span>containerTag-scoped, always</span>
      </div>
      <div className="hero-divider" />
      <div className="hero-main">
        <div className="wordmark">
          <span className="logo-mark">✦</span> convex-supermemory
        </div>
        <h1 className="hero-title">
          Give your app a memory it <span className="hl">actually keeps</span>
        </h1>
        <p className="hero-sub">
          Every write below hits your own Supermemory project over REST, and mirrors into Convex
          so reads stay reactive and local.
        </p>
        <FlowDiagram />
      </div>
      <div className="hero-stripe" />
      <div className="user-switch">
        <span className="user-switch-label">containerTag</span>
        {DEMO_USERS.map((u) => (
          <Chip key={u} active={props.userId === u} onClick={() => props.onUserId(u)}>
            {u}
          </Chip>
        ))}
      </div>
      <nav className="tabs">
        <button className={`tab ${props.tab === "memories" ? "active" : ""}`} onClick={() => props.onTab("memories")}>
          Memories
        </button>
        <button
          className={`tab ${props.tab === "documents" ? "active" : ""}`}
          onClick={() => props.onTab("documents")}
        >
          Documents
        </button>
        <button className={`tab ${props.tab === "search" ? "active" : ""}`} onClick={() => props.onTab("search")}>
          Search
        </button>
        <button className={`tab ${props.tab === "history" ? "active" : ""}`} onClick={() => props.onTab("history")}>
          History
        </button>
      </nav>
    </div>
  );
}
