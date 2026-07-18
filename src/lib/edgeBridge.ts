import { invoke } from "@tauri-apps/api/core";

export type CapturePhase = "paused" | "capturing";
export type Sensitivity = "normal" | "review";
export type SourceState = "demo" | "ready" | "not-connected" | "planned";
export type VerificationStatus = "pending" | "verified" | "needs-correction";

export interface CaptureSource {
  kind: "screen" | "audio" | "mcp";
  label: string;
  status: SourceState;
}

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
  sources: CaptureSource[];
  events: CaptureEvent[];
}

export interface SopSection {
  title: string;
  items: string[];
}

export interface VerificationFlag {
  id: string;
  text: string;
  status: VerificationStatus;
}

export interface EvidenceLink {
  evidenceId: string;
  occurredAt: string;
  application: string;
  label: string;
}

export interface SopRecipe {
  windowMinutes: number;
  instruction: string;
  sources: string[];
}

export interface SopDraft {
  title: string;
  objective: string;
  systemsUsed: string[];
  sections: SopSection[];
  decisions: string[];
  exceptions: string[];
  verificationFlags: VerificationFlag[];
  evidenceLinks: EvidenceLink[];
  recipe: SopRecipe;
}

const sources: CaptureSource[] = [
  { kind: "screen", label: "Screen + app context", status: "demo" },
  { kind: "audio", label: "Audio transcript", status: "not-connected" },
  { kind: "mcp", label: "Local MCP", status: "planned" },
];

const seedEvents: CaptureEvent[] = [
  {
    id: "evt-001",
    occurredAt: new Date().toISOString(),
    application: "VS Code",
    windowTitle: "permission-aware-retrieval.md",
    summary: "Compared ACL snapshot semantics with the candidate publishing boundary.",
    sensitivity: "normal",
    selected: false,
  },
  {
    id: "evt-002",
    occurredAt: new Date().toISOString(),
    application: "Browser",
    windowTitle: "Tauri v2 — calling Rust from the frontend",
    summary: "Reviewed the command boundary for a device-local capture runtime.",
    sensitivity: "normal",
    selected: false,
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
  sources,
  events: seedEvents,
};
let browserDraft: SopDraft | undefined;

function inTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function buildBrowserDraft(instruction: string): SopDraft {
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
    verificationFlags: [
      { id: "verify-permission-owner", text: "Confirm the destination permission policy with a human owner.", status: "pending" },
    ],
    evidenceLinks: selected.map((event) => ({
      evidenceId: event.id,
      occurredAt: event.occurredAt,
      application: event.application,
      label: event.windowTitle,
    })),
    recipe: {
      windowMinutes: 60,
      instruction,
      sources: ["screen-text", "transcript", "app-names", "timeline-moments"],
    },
  };
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
    browserDraft = undefined;
    return structuredClone(browserState);
  },

  async draftSop(instruction: string): Promise<SopDraft> {
    if (inTauri()) return invoke("draft_sop", { instruction });
    browserDraft = buildBrowserDraft(instruction);
    return structuredClone(browserDraft);
  },

  async exportCandidate(
    reviewed: boolean,
    reviewerLabel: string,
    instruction: string,
  ): Promise<string> {
    if (!reviewed) throw new Error("complete teammate verification before export");
    if (inTauri()) {
      return invoke("export_candidate", {
        reviewed,
        reviewerLabel,
        instruction,
      });
    }
    if (!browserDraft) throw new Error("create an SOP draft before export");
    const approvedDraft = {
      ...browserDraft,
      verificationFlags: browserDraft.verificationFlags.map((flag) => ({ ...flag, status: "verified" })),
    };
    const envelope = {
      schemaVersion: "1.1",
      generatedAt: new Date().toISOString(),
      approvedByHuman: true,
      review: { status: "approved", reviewerLabel, reviewedAt: new Date().toISOString() },
      draft: approvedDraft,
    };
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "orgmemory-edge-approved-sop.json";
    anchor.click();
    URL.revokeObjectURL(href);
    return "browser download";
  },
};
