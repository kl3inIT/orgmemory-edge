import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Check,
  ChevronRight,
  CircleStop,
  FileJson,
  Laptop,
  ListChecks,
  MonitorCheck,
  Pause,
  Play,
  Repeat2,
  ShieldCheck,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { edgeBridge, type CaptureEvent, type CaptureSnapshot, type SopDraft } from "./lib/edgeBridge";
import "./App.css";

const emptySnapshot: CaptureSnapshot = {
  phase: "paused",
  capturedEvents: 0,
  storageMode: "device-only",
  events: [],
};

function App() {
  const [snapshot, setSnapshot] = useState<CaptureSnapshot>(emptySnapshot);
  const [busy, setBusy] = useState(false);
  const [exportPath, setExportPath] = useState<string>();
  const [view, setView] = useState<"pilot" | "admin">("pilot");
  const [sop, setSop] = useState<SopDraft>();
  const [pipeSaved, setPipeSaved] = useState(false);

  useEffect(() => {
    edgeBridge.snapshot().then(setSnapshot);
  }, []);

  const selected = useMemo(
    () => snapshot.events.filter((event) => event.selected),
    [snapshot.events],
  );

  async function toggleCapture() {
    setBusy(true);
    try {
      setSnapshot(await edgeBridge.setCapture(snapshot.phase !== "capturing"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleEvent(event: CaptureEvent) {
    setSnapshot(await edgeBridge.toggleEvent(event.id));
  }

  async function exportCandidate() {
    setBusy(true);
    try {
      setExportPath(await edgeBridge.exportCandidate());
    } finally {
      setBusy(false);
    }
  }

  async function createSop() {
    setBusy(true);
    try {
      setSop(await edgeBridge.draftSop());
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <aside className="rail">
        <div className="mark" aria-label="OrgMemory Edge">OE</div>
        <nav aria-label="Primary">
          <button className={`nav-icon ${view === "pilot" ? "active" : ""}`} title="Pilot workspace" onClick={() => setView("pilot")}><UserRound size={19} /></button>
          <button className={`nav-icon ${view === "admin" ? "active" : ""}`} title="Admin device status" onClick={() => setView("admin")}><MonitorCheck size={19} /></button>
        </nav>
        <span className="version">v0.1</span>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">{view === "pilot" ? "PILOT WORKSPACE" : "ADMIN CONSOLE"}</span>
            <h1>{view === "pilot" ? <>Turn one good run into a <em>team-ready SOP.</em></> : <>Know every device is <em>healthy and consenting.</em></>}</h1>
          </div>
          <div className={`status-pill ${snapshot.phase}`}>
            <span className="status-dot" />
            {snapshot.phase === "capturing" ? "CAPTURING" : "PAUSED"}
          </div>
        </header>

        {view === "pilot" ? <>
        <section className="control-grid">
          <article className="capture-card">
            <div className="capture-card__meta">
              <span>SESSION 01</span>
              <span>{snapshot.storageMode.toUpperCase()}</span>
            </div>
            <div className="capture-card__body">
              <div className={`pulse-orbit ${snapshot.phase}`}>
                <span>{snapshot.phase === "capturing" ? <Activity /> : <CircleStop />}</span>
              </div>
              <div>
                <p className="kicker">RECORD ONE CLEAN PASS</p>
                <h2>{snapshot.phase === "capturing" ? "Learning the workflow" : "Ready when you are"}</h2>
                <p className="muted">Use your normal tools and complete the workflow once. Screen context stays local until review.</p>
              </div>
            </div>
            <button className="capture-button" onClick={toggleCapture} disabled={busy}>
              {snapshot.phase === "capturing" ? <Pause size={18} /> : <Play size={18} />}
              {snapshot.phase === "capturing" ? "Pause capture" : "Start with consent"}
            </button>
          </article>

          <article className="policy-card">
            <div className="section-label"><ShieldCheck size={16} /> ACTIVE POLICY</div>
            <h3>Private by default</h3>
            <ul>
              <li><Check size={15} /> Device-local processing</li>
              <li><Check size={15} /> Password fields excluded</li>
              <li><Check size={15} /> Human approval before export</li>
            </ul>
            <button className="text-button">Review policy <ChevronRight size={15} /></button>
          </article>
        </section>

        <section className="feed-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LAST 60 MINUTES</span>
              <h2>Workflow evidence</h2>
            </div>
            <span className="counter">{selected.length} selected / {snapshot.events.length} events</span>
          </div>

          <div className="event-list">
            {snapshot.events.map((event, index) => (
              <button
                className={`event-row ${event.selected ? "selected" : ""}`}
                key={event.id}
                onClick={() => toggleEvent(event)}
              >
                <span className="event-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="event-app">{event.application}</span>
                <span className="event-copy">
                  <strong>{event.windowTitle}</strong>
                  <small>{event.summary}</small>
                </span>
                <span className={`risk ${event.sensitivity}`}>{event.sensitivity}</span>
                <span className="event-check">{event.selected && <Check size={15} />}</span>
              </button>
            ))}
          </div>
          <div className="sop-action-row">
            <p><WandSparkles size={17} /> Build a step-by-step SOP from selected screen context, apps and timeline moments.</p>
            <button onClick={createSop} disabled={!selected.length || busy}>Create SOP draft <ChevronRight size={16} /></button>
          </div>
        </section>

        {sop && <section className="sop-draft">
          <div className="sop-title">
            <div><span className="eyebrow">DRAFT · HUMAN REVIEW REQUIRED</span><h2>{sop.title}</h2></div>
            <span className="evidence-count">{sop.evidenceIds.length} evidence links</span>
          </div>
          <p className="sop-objective">{sop.objective}</p>
          <div className="system-chips">{sop.systemsUsed.map((system) => <span key={system}>{system}</span>)}</div>
          <div className="sop-columns">
            <div className="sop-steps">
              {sop.sections.map((section, index) => <article key={section.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{section.title}</h3><ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </article>)}
            </div>
            <aside className="review-panel">
              <h3><ListChecks size={16} /> Verify with a teammate</h3>
              {sop.verificationFlags.map((flag) => <p key={flag}>{flag}</p>)}
              <h4>Exception</h4>
              {sop.exceptions.map((exception) => <p key={exception}>{exception}</p>)}
            </aside>
          </div>
          <button className="pipe-button" onClick={() => setPipeSaved(true)}><Repeat2 size={16} /> {pipeSaved ? "Pipe saved for repeat runs" : "Save this recipe as a pipe"}</button>
        </section>}
        </> : <AdminConsole snapshot={snapshot} />}

        {view === "pilot" && <footer className="publish-bar">
          <div className="publish-copy">
            <Sparkles size={18} />
            <span><strong>{sop ? "SOP draft ready" : "Evidence stays local"}</strong><small>Reviewable JSON, no server required</small></span>
          </div>
          {exportPath && <span className="export-path" title={exportPath}>Saved: {exportPath}</span>}
          <button className="export-button" onClick={exportCandidate} disabled={!selected.length || busy}>
            <FileJson size={17} /> Export candidate
          </button>
        </footer>}
      </section>
    </main>
  );
}

function AdminConsole({ snapshot }: { snapshot: CaptureSnapshot }) {
  const devices = [
    { name: "Pilot Windows 01", platform: "Windows 11", status: snapshot.phase, lastSeen: "just now", policy: "sop-pilot-v1" },
    { name: "QA Lab 02", platform: "Windows 11", status: "paused", lastSeen: "4 min ago", policy: "sop-pilot-v1" },
  ];
  return <section className="admin-console">
    <div className="admin-summary">
      <article><Laptop /><span><strong>{devices.length}</strong><small>enrolled devices</small></span></article>
      <article><ShieldCheck /><span><strong>100%</strong><small>consent policy current</small></span></article>
      <article><Activity /><span><strong>Healthy</strong><small>capture agents</small></span></article>
    </div>
    <div className="privacy-callout"><ShieldCheck size={18} /><p><strong>Metadata, not surveillance.</strong> Admins see agent health, policy and consent state. Raw screen, audio and SOP evidence remain with the pilot unless explicitly published.</p></div>
    <div className="device-table">
      <div className="device-header"><span>Device</span><span>Agent</span><span>Consent policy</span><span>Last seen</span></div>
      {devices.map((device) => <div className="device-row" key={device.name}>
        <span><MonitorCheck size={17} /><strong>{device.name}</strong><small>{device.platform}</small></span>
        <span className={`device-state ${device.status}`}><i />{device.status}</span>
        <code>{device.policy}</code><time>{device.lastSeen}</time>
      </div>)}
    </div>
  </section>;
}

export default App;
