import { useState } from "react";
import "./theme.css";
import { Header, type Tab } from "./components/Header";
import { TopBanner } from "./components/TopBanner";
import { Console } from "./components/Console";
import { MemoryPanel } from "./components/MemoryPanel";
import { DocumentPanel } from "./components/DocumentPanel";
import { SearchPanel } from "./components/SearchPanel";
import { History } from "./components/History";

export default function App() {
  const [tab, setTab] = useState<Tab>("memories");
  const [userId, setUserId] = useState("user_demo");

  return (
    <div className="shell">
      <div className="main">
        <Header tab={tab} onTab={setTab} userId={userId} onUserId={setUserId} />
        <TopBanner />

        {tab === "memories" && <MemoryPanel userId={userId} />}
        {tab === "documents" && <DocumentPanel userId={userId} />}
        {tab === "search" && <SearchPanel userId={userId} />}
        {tab === "history" && <History />}
      </div>
      <Console />
    </div>
  );
}
