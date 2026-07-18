import { invoke } from "@tauri-apps/api/core";

export type CapturePhase = "paused" | "capturing";
export type Sensitivity = "normal" | "review";

export interface CaptureEvent {
  id: string;
  occurredAt: string;
  application: string;
  windowTitle: string;
  summary: string;
  sensitivity: Sensitivity;
  selected: boolean;
}

export interface CaptureSnapshot {
  phase: CapturePhase;
  sessionStartedAt?: string;
  capturedEvents: number;
  storageMode: "device-only";
  events: CaptureEvent[];
}

export interface SopSection {
  title: string;
  items: string[];
}

export interface SopDraft {
  title: string;
  objective: string;
  systemsUsed: string[];
  sections: SopSection[];
  decisions: string[];
  exceptions: string[];
  verificationFlags: string[];
  evidenceIds: string[];
}

const seedEvents: CaptureEvent[] = [
  {
    id: "evt-001",
    occurredAt: new Date().toISOString(),
    application: "VS Code",
    windowTitle: "permission-aware-retrieval.md",
    summary: "Compared ACL snapshot semantics with the candidate publishing boundary.",
    sensitivity: "normal",
    selected: true,
  },
  {
    id: "evt-002",
    occurredAt: new Date().toISOString(),
    application: "Browser",
    windowTitle: "Tauri v2 — calling Rust from the frontend",
    summary: "Reviewed the command boundary for a device-local capture runtime.",
    sensitivity: "normal",
    selected: true,
  },
  {
    id: "evt-003",
    occurredAt: new Date().toISOString(),
    application: "Teams",
    windowTitle: "OrgMemory product discussion",
    summary: "Potentially sensitive conversation; requires explicit review before export.",
    sensitivity: "review",
    selected: false,
  },
];

let browserState: CaptureSnapshot = {
  phase: "paused",
  capturedEvents: seedEvents.length,
  storageMode: "device-only",
  events: seedEvents,
};

function inTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export const edgeBridge = {
  async snapshot(): Promise<CaptureSnapshot> {
    return inTauri() ? invoke("capture_snapshot") : structuredClone(browserState);
  },

  async setCapture(enabled: boolean): Promise<CaptureSnapshot> {
    if (inTauri()) return invoke("set_capture_enabled", { enabled });
    browserState = {
      ...browserState,
      phase: enabled ? "capturing" : "paused",
      sessionStartedAt: enabled ? new Date().toISOString() : browserState.sessionStartedAt,
    };
    return structuredClone(browserState);
  },

  async toggleEvent(eventId: string): Promise<CaptureSnapshot> {
    if (inTauri()) return invoke("toggle_event_selection", { eventId });
    browserState = {
      ...browserState,
      events: browserState.events.map((event) =>
        event.id === eventId ? { ...event, selected: !event.selected } : event,
      ),
    };
    return structuredClone(browserState);
  },

  async exportCandidate(): Promise<string> {
    if (inTauri()) return invoke("export_candidate");
    const selected = browserState.events.filter((event) => event.selected);
    const envelope = {
      schemaVersion: "1.0",
      generatedAt: new Date().toISOString(),
      title: "Reviewed desktop workflow evidence",
      summary: "Human-approved evidence captured by OrgMemory Edge.",
      evidence: selected,
      provenance: { captureMode: "device-local", approvedByHuman: true },
    };
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "orgmemory-capability-candidate.json";
    anchor.click();
    URL.revokeObjectURL(href);
    return "browser download";
  },

  async draftSop(): Promise<SopDraft> {
    if (inTauri()) return invoke("draft_sop");
    const selected = browserState.events.filter((event) => event.selected);
    return {
      title: "Publish a permission-aware knowledge update",
      objective: "Turn reviewed workflow evidence into a safe, reusable team procedure.",
      systemsUsed: [...new Set(selected.map((event) => event.application))],
      sections: [
        {
          title: "Prepare the working context",
          items: ["Open the source note and confirm the target audience.", "Check the current permission boundary before drafting."],
        },
        {
          title: "Produce and verify the update",
          items: ["Draft the update from selected evidence only.", "Review every flagged assumption with a teammate before publishing."],
        },
      ],
      decisions: ["Keep raw evidence device-local; export only the reviewed SOP draft."],
      exceptions: ["Stop capture when a password, secret, or unrelated conversation appears."],
      verificationFlags: ["Confirm the destination permission policy with a human owner."],
      evidenceIds: selected.map((event) => event.id),
    };
  },
};
