import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleStop,
  Clock3,
  FileJson,
  Laptop,
  ListChecks,
  Mic2,
  MonitorCheck,
  MonitorUp,
  Pause,
  Play,
  Plug,
  Repeat2,
  ShieldCheck,
  Sparkles,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import {
  edgeBridge,
  type CaptureEvent,
  type CaptureSnapshot,
  type SopDraft,
  type VerificationStatus,
} from "./lib/edgeBridge";
import "./App.css";

const defaultInstruction = `Using only capture session SESSION-01 from the last 60 minutes, create a training SOP for a new teammate. Use screen text, transcript, approved app names, and timestamped timeline evidence. Include systems used, numbered actions, decisions, exceptions, and expected output. Flag anything inferred or unsupported as Human verification required.`;

const emptySnapshot: CaptureSnapshot = {
  phase: "paused",
  capturedEvents: 0,
  storageMode: "device-only",
  sources: [],
  events: [],
};

function App() {
  const [snapshot, setSnapshot] = useState<CaptureSnapshot>(emptySnapshot);
  const [busy, setBusy] = useState(false);
  const [exportPath, setExportPath] = useState<string>();
  const [view, setView] = useState<"pilot" | "admin">("pilot");
  const [sop, setSop] = useState<SopDraft>();
  const [pipeSaved, setPipeSaved] = useState(false);
  const [instruction, setInstruction] = useState(defaultInstruction);
  const [reviewerLabel, setReviewerLabel] = useState("");
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    edgeBridge.snapshot().then(setSnapshot);
  }, []);

  const selected = useMemo(
    () => snapshot.events.filter((event) => event.selected),
    [snapshot.events],
  );
  const reviewReady = Boolean(
    sop
    && reviewerLabel.trim()
    && sop.verificationFlags.every((flag) => flag.status === "verified"),
  );

  async function requestCaptureToggle() {
    if (snapshot.phase === "capturing") {
      await setCapture(false);
      return;
    }
    setConsentAccepted(false);
    setConsentOpen(true);
  }

  async function setCapture(enabled: boolean) {
    setBusy(true);
    try {
      setSnapshot(await edgeBridge.setCapture(enabled));
      setConsentOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function toggleEvent(event: CaptureEvent) {
    setSnapshot(await edgeBridge.toggleEvent(event.id));
    setSop(undefined);
    setExportPath(undefined);
    setPipeSaved(false);
  }

  async function createSop() {
    setBusy(true);
    try {
      setSop(await edgeBridge.draftSop(instruction));
      setExportPath(undefined);
      setPipeSaved(false);
    } finally {
      setBusy(false);
    }
  }

  function markVerification(flagId: string, status: VerificationStatus) {
    setSop((current) => current && ({
      ...current,
      verificationFlags: current.verificationFlags.map((flag) =>
        flag.id === flagId ? { ...flag, status } : flag,
      ),
    }));
  }

  async function exportCandidate() {
    setBusy(true);
    try {
      setExportPath(await edgeBridge.exportCandidate(
        reviewReady,
        reviewerLabel.trim(),
        instruction,
      ));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <aside className="rail">
        <div className="mark" aria-label="OrgMemory Edge">OE</div>
        <nav aria-label="Primary">
          <button aria-label="Pilot workspace" aria-pressed={view === "pilot"} className={`nav-icon ${view === "pilot" ? "active" : ""}`} title="Pilot workspace" onClick={() => setView("pilot")}><UserRound size={19} /></button>
          <button aria-label="Admin device status" aria-pressed={view === "admin"} className={`nav-icon ${view === "admin" ? "active" : ""}`} title="Admin device status" onClick={() => setView("admin")}><MonitorCheck size={19} /></button>
        </nav>
        <span className="version">v0.1</span>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">{view === "pilot" ? "ENTERPRISE PILOT · SEEDED DEMO" : "ADMIN CONSOLE · DEMO DATA"}</span>
            <h1>{view === "pilot" ? <>Turn one good run into a <em>team-ready SOP.</em></> : <>See device <em>health and consent state.</em></>}</h1>
          </div>
          <div className={`status-pill ${snapshot.phase}`} aria-live="polite">
            <span className="status-dot" />
            {snapshot.phase === "capturing" ? "CAPTURING" : "PAUSED"}
          </div>
        </header>

        {view === "pilot" ? <>
          <section className="control-grid">
            <article className="capture-card">
              <div className="capture-card__meta">
                <span>SESSION-01</span>
                <span>{snapshot.storageMode.toUpperCase()}</span>
              </div>
              <div className="capture-card__body">
                <div className={`pulse-orbit ${snapshot.phase}`}>
                  <span>{snapshot.phase === "capturing" ? <Activity /> : <CircleStop />}</span>
                </div>
                <div>
                  <p className="kicker">RECORD ONE CLEAN PASS</p>
                  <h2>{snapshot.phase === "capturing" ? "Learning the workflow" : "Ready when you are"}</h2>
                  <p className="muted">Use normal tools and complete the workflow once. This foundation uses seeded evidence; native capture is not connected yet.</p>
                </div>
              </div>
              <div className="source-strip" aria-label="Capture source status">
                {snapshot.sources.map((source) => <div key={source.kind}>
                  {source.kind === "screen" ? <MonitorUp size={15} /> : source.kind === "audio" ? <Mic2 size={15} /> : <Plug size={15} />}
                  <span><strong>{source.label}</strong><small className={`source-state ${source.status}`}>{source.status}</small></span>
                </div>)}
              </div>
              <button className="capture-button" onClick={requestCaptureToggle} disabled={busy}>
                {snapshot.phase === "capturing" ? <Pause size={18} /> : <Play size={18} />}
                {snapshot.phase === "capturing" ? "Pause capture" : "Review scope and start"}
              </button>
            </article>

            <article className="policy-card">
              <div className="section-label"><ShieldCheck size={16} /> PILOT POLICY</div>
              <h3>Private by default</h3>
              <ul>
                <li><Check size={15} /> Device-local demonstration</li>
                <li><Clock3 size={15} /> Named 60-minute session</li>
                <li><Check size={15} /> Human approval required</li>
              </ul>
              <button className="text-button" onClick={() => setConsentOpen(true)}>Review consent scope <ChevronRight size={15} /></button>
            </article>
          </section>

          <section className="feed-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">SESSION-01 · LAST 60 MINUTES</span>
                <h2>Workflow evidence</h2>
              </div>
              <span className="counter">{selected.length} selected / {snapshot.events.length} events</span>
            </div>

            <div className="event-list">
              {snapshot.events.map((event, index) => (
                <button
                  aria-pressed={event.selected}
                  className={`event-row ${event.selected ? "selected" : ""}`}
                  key={event.id}
                  onClick={() => toggleEvent(event)}
                >
                  <span className="event-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="event-app">{event.application}</span>
                  <span className="event-copy">
                    <strong>{event.windowTitle}</strong>
                    <small>{new Date(event.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · {event.summary}</small>
                  </span>
                  <span className={`risk ${event.sensitivity}`}>{event.sensitivity}</span>
                  <span className="event-check">{event.selected && <Check size={15} />}</span>
                </button>
              ))}
            </div>
            <div className="sop-prompt">
              <label htmlFor="sop-instruction"><WandSparkles size={17} /> SOP instruction</label>
              <textarea id="sop-instruction" value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={4} />
              <div><small>Only selected evidence from this named session is eligible.</small><button onClick={createSop} disabled={!selected.length || !instruction.trim() || busy}>Create SOP draft <ChevronRight size={16} /></button></div>
            </div>
          </section>

          {sop && <section className="sop-draft">
            <div className="sop-title">
              <div><span className="eyebrow">DRAFT · HUMAN REVIEW REQUIRED</span><h2>{sop.title}</h2></div>
              <span className="evidence-count">{sop.evidenceLinks.length} evidence locators</span>
            </div>
            <p className="sop-objective">{sop.objective}</p>
            <div className="system-chips">{sop.systemsUsed.map((system) => <span key={system}>{system}</span>)}</div>
            <div className="sop-columns">
              <div className="sop-steps">
                {sop.sections.map((section, index) => <article key={section.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{section.title}</h3><ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul></div>
                </article>)}
                <div className="evidence-locators">
                  <h3>Evidence locators</h3>
                  {sop.evidenceLinks.map((link) => <div key={link.evidenceId}><code>{link.evidenceId}</code><span>{link.application} · {link.label}</span><time>{new Date(link.occurredAt).toLocaleTimeString()}</time></div>)}
                </div>
              </div>
              <aside className="review-panel">
                <h3><ListChecks size={16} /> Teammate verification</h3>
                <label className="reviewer-field">Reviewer label<input value={reviewerLabel} onChange={(event) => setReviewerLabel(event.target.value)} placeholder="e.g. QA lead" /></label>
                <h4>Decisions</h4>
                {sop.decisions.map((decision) => <p key={decision}>{decision}</p>)}
                <h4>Exceptions</h4>
                {sop.exceptions.map((exception) => <p key={exception}>{exception}</p>)}
                <h4>Human verification</h4>
                {sop.verificationFlags.map((flag) => <div className={`verification-item ${flag.status}`} key={flag.id}>
                  <p>{flag.text}</p>
                  <div>
                    <button aria-pressed={flag.status === "verified"} onClick={() => markVerification(flag.id, "verified")}><CheckCircle2 size={14} /> Verified</button>
                    <button aria-pressed={flag.status === "needs-correction"} onClick={() => markVerification(flag.id, "needs-correction")}><AlertTriangle size={14} /> AI missed it</button>
                  </div>
                </div>)}
                <div className={`review-gate ${reviewReady ? "ready" : "blocked"}`}>
                  {reviewReady ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{reviewReady ? "Approval gate satisfied" : "Resolve flags and identify reviewer"}</span>
                </div>
              </aside>
            </div>
            <button className="pipe-button" aria-pressed={pipeSaved} disabled={!reviewReady} onClick={() => setPipeSaved(true)}><Repeat2 size={16} /> {pipeSaved ? "Pipe recipe staged in this demo" : "Preview repeatable pipe recipe"}</button>
          </section>}
        </> : <AdminConsole snapshot={snapshot} />}

        {view === "pilot" && <footer className="publish-bar">
          <div className="publish-copy">
            <Sparkles size={18} />
            <span><strong>{reviewReady ? "Approved SOP ready" : sop ? "Teammate review pending" : "Evidence stays local"}</strong><small>{reviewReady ? "Reviewer identity and verification status will travel with the export" : "Export is blocked until the human review gate passes"}</small></span>
          </div>
          {exportPath && <span className="export-path" title={exportPath}>Saved: {exportPath}</span>}
          <button className="export-button" onClick={exportCandidate} disabled={!reviewReady || busy}>
            <FileJson size={17} /> Export approved SOP
          </button>
        </footer>}
      </section>

      {consentOpen && <div className="modal-backdrop" role="presentation">
        <section className="consent-modal" role="dialog" aria-modal="true" aria-labelledby="consent-title">
          <button className="modal-close" aria-label="Close consent scope" onClick={() => setConsentOpen(false)}><X size={18} /></button>
          <span className="eyebrow">NAMED CAPTURE SESSION</span>
          <h2 id="consent-title">Confirm the clean-pass scope</h2>
          <p>This foundation demonstrates the consent flow with seeded evidence. It does not capture the live desktop or audio yet.</p>
          <dl>
            <div><dt>Purpose</dt><dd>Create one training SOP</dd></div>
            <div><dt>Scope</dt><dd>SESSION-01 · up to 60 minutes</dd></div>
            <div><dt>Screen</dt><dd>Demo source</dd></div>
            <div><dt>Audio</dt><dd>Off · separate consent required</dd></div>
            <div><dt>Storage</dt><dd>Device-local</dd></div>
          </dl>
          <label className="consent-check"><input type="checkbox" checked={consentAccepted} onChange={(event) => setConsentAccepted(event.target.checked)} /><span>I understand the active sources and consent to start this named session.</span></label>
          <button className="capture-button" disabled={!consentAccepted || busy} onClick={() => setCapture(true)}><Play size={17} /> Start SESSION-01</button>
        </section>
      </div>}
    </main>
  );
}

function AdminConsole({ snapshot }: { snapshot: CaptureSnapshot }) {
  const pilotConsent = snapshot.sessionStartedAt
    ? snapshot.phase === "capturing"
      ? "SESSION-01 consented · active"
      : "SESSION-01 consented · paused"
    : "no active consent";
  const devices = [
    { name: "Pilot Windows 01", platform: "Windows 11", version: "0.1.0-demo", status: snapshot.phase, consent: pilotConsent, lastSeen: "just now", policy: "sop-pilot-v1" },
    { name: "QA Lab 02", platform: "Windows 11", version: "0.1.0-demo", status: "paused", consent: "no active consent", lastSeen: "4 min ago", policy: "sop-pilot-v1" },
  ];
  return <section className="admin-console">
    <div className="admin-summary">
      <article><Laptop /><span><strong>{devices.length}</strong><small>demo devices</small></span></article>
      <article><ShieldCheck /><span><strong>Demo</strong><small>consent metadata</small></span></article>
      <article><Activity /><span><strong>Seeded</strong><small>agent health data</small></span></article>
    </div>
    <div className="privacy-callout"><ShieldCheck size={18} /><p><strong>Metadata, not surveillance.</strong> Admins see health, version, policy and consent state. Raw screen, audio and SOP evidence remain with the pilot unless explicitly published.</p></div>
    <div className="device-table">
      <div className="device-header"><span>Device</span><span>Agent / consent</span><span>Policy</span><span>Last seen</span></div>
      {devices.map((device) => <div className="device-row" key={device.name}>
        <span><MonitorCheck size={17} /><strong>{device.name}</strong><small>{device.platform}</small></span>
        <span className="agent-cell"><span className={`device-state ${device.status}`}><i />{device.status} · {device.version}</span><small>{device.consent}</small></span>
        <code>{device.policy}</code><time>{device.lastSeen}</time>
      </div>)}
    </div>
  </section>;
}

export default App;
