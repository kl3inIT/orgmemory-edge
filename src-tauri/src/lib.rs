use chrono::Utc;
use serde::Serialize;
use std::{fs, sync::Mutex};
use tauri::{Manager, State};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CaptureSource {
    kind: &'static str,
    label: &'static str,
    status: &'static str,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CaptureEvent {
    id: String,
    occurred_at: String,
    application: String,
    window_title: String,
    summary: String,
    sensitivity: String,
    selected: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CaptureSnapshot {
    phase: String,
    session_started_at: Option<String>,
    captured_events: usize,
    storage_mode: &'static str,
    sources: Vec<CaptureSource>,
    events: Vec<CaptureEvent>,
}

#[derive(Default)]
struct CaptureState {
    enabled: bool,
    session_started_at: Option<String>,
    events: Vec<CaptureEvent>,
}

impl CaptureState {
    fn seeded() -> Self {
        Self {
            events: vec![
                CaptureEvent {
                    id: "evt-001".into(),
                    occurred_at: Utc::now().to_rfc3339(),
                    application: "VS Code".into(),
                    window_title: "permission-aware-retrieval.md".into(),
                    summary: "Compared ACL snapshot semantics with the candidate publishing boundary.".into(),
                    sensitivity: "normal".into(),
                    selected: false,
                },
                CaptureEvent {
                    id: "evt-002".into(),
                    occurred_at: Utc::now().to_rfc3339(),
                    application: "Browser".into(),
                    window_title: "Tauri v2 — calling Rust from the frontend".into(),
                    summary: "Reviewed the command boundary for a device-local capture runtime.".into(),
                    sensitivity: "normal".into(),
                    selected: false,
                },
                CaptureEvent {
                    id: "evt-003".into(),
                    occurred_at: Utc::now().to_rfc3339(),
                    application: "Teams".into(),
                    window_title: "OrgMemory product discussion".into(),
                    summary: "Potentially sensitive conversation; requires explicit review before export.".into(),
                    sensitivity: "review".into(),
                    selected: false,
                },
            ],
            ..Self::default()
        }
    }

    fn snapshot(&self) -> CaptureSnapshot {
        CaptureSnapshot {
            phase: if self.enabled { "capturing" } else { "paused" }.into(),
            session_started_at: self.session_started_at.clone(),
            captured_events: self.events.len(),
            storage_mode: "device-only",
            sources: vec![
                CaptureSource {
                    kind: "screen",
                    label: "Screen + app context",
                    status: "demo",
                },
                CaptureSource {
                    kind: "audio",
                    label: "Audio transcript",
                    status: "not-connected",
                },
                CaptureSource {
                    kind: "mcp",
                    label: "Local MCP",
                    status: "planned",
                },
            ],
            events: self.events.clone(),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SopSection {
    title: String,
    items: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VerificationFlag {
    id: &'static str,
    text: String,
    status: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct EvidenceLink {
    evidence_id: String,
    occurred_at: String,
    application: String,
    label: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SopRecipe {
    window_minutes: u8,
    instruction: String,
    sources: Vec<&'static str>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SopDraft {
    title: String,
    objective: String,
    systems_used: Vec<String>,
    sections: Vec<SopSection>,
    decisions: Vec<String>,
    exceptions: Vec<String>,
    verification_flags: Vec<VerificationFlag>,
    evidence_links: Vec<EvidenceLink>,
    recipe: SopRecipe,
}

fn lock_state<'a>(
    state: &'a State<'a, Mutex<CaptureState>>,
) -> Result<std::sync::MutexGuard<'a, CaptureState>, String> {
    state
        .lock()
        .map_err(|_| "capture state lock was poisoned".to_string())
}

#[tauri::command]
fn capture_snapshot(state: State<'_, Mutex<CaptureState>>) -> Result<CaptureSnapshot, String> {
    Ok(lock_state(&state)?.snapshot())
}

#[tauri::command]
fn set_capture_enabled(
    enabled: bool,
    state: State<'_, Mutex<CaptureState>>,
) -> Result<CaptureSnapshot, String> {
    let mut state = lock_state(&state)?;
    state.enabled = enabled;
    if enabled && state.session_started_at.is_none() {
        state.session_started_at = Some(Utc::now().to_rfc3339());
    }
    Ok(state.snapshot())
}

#[tauri::command]
fn toggle_event_selection(
    event_id: String,
    state: State<'_, Mutex<CaptureState>>,
) -> Result<CaptureSnapshot, String> {
    let mut state = lock_state(&state)?;
    let event = state
        .events
        .iter_mut()
        .find(|event| event.id == event_id)
        .ok_or_else(|| format!("capture event not found: {event_id}"))?;
    event.selected = !event.selected;
    Ok(state.snapshot())
}

fn build_sop(
    state: &CaptureState,
    instruction: String,
    reviewed: bool,
) -> Result<SopDraft, String> {
    let selected: Vec<_> = state.events.iter().filter(|event| event.selected).collect();
    if selected.is_empty() {
        return Err("select at least one evidence item before drafting an SOP".into());
    }
    if instruction.trim().is_empty() {
        return Err("SOP instruction cannot be empty".into());
    }

    let mut systems_used: Vec<String> = selected
        .iter()
        .map(|event| event.application.clone())
        .collect();
    systems_used.sort();
    systems_used.dedup();

    Ok(SopDraft {
        title: "Publish a permission-aware knowledge update".into(),
        objective: "Turn reviewed workflow evidence into a safe, reusable team procedure.".into(),
        systems_used,
        sections: vec![
            SopSection {
                title: "Prepare the working context".into(),
                items: vec![
                    "Open the source material and confirm the target audience.".into(),
                    "Check the current permission boundary before drafting.".into(),
                ],
            },
            SopSection {
                title: "Produce and verify the update".into(),
                items: vec![
                    "Draft the update from selected evidence only.".into(),
                    "Review every flagged assumption with a teammate before publishing.".into(),
                ],
            },
        ],
        decisions: vec![
            "Keep raw evidence device-local; export only the reviewed SOP draft.".into(),
        ],
        exceptions: vec![
            "Stop capture when a password, secret, or unrelated conversation appears.".into(),
        ],
        verification_flags: vec![VerificationFlag {
            id: "verify-permission-owner",
            text: "Confirm the destination permission policy with a human owner.".into(),
            status: if reviewed { "verified" } else { "pending" },
        }],
        evidence_links: selected
            .iter()
            .map(|event| EvidenceLink {
                evidence_id: event.id.clone(),
                occurred_at: event.occurred_at.clone(),
                application: event.application.clone(),
                label: event.window_title.clone(),
            })
            .collect(),
        recipe: SopRecipe {
            window_minutes: 60,
            instruction,
            sources: vec!["screen-text", "transcript", "app-names", "timeline-moments"],
        },
    })
}

#[tauri::command]
fn draft_sop(
    instruction: String,
    state: State<'_, Mutex<CaptureState>>,
) -> Result<SopDraft, String> {
    let state = lock_state(&state)?;
    build_sop(&state, instruction, false)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ReviewRecord {
    status: &'static str,
    reviewer_label: String,
    reviewed_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SopEnvelope {
    schema_version: &'static str,
    generated_at: String,
    approved_by_human: bool,
    review: ReviewRecord,
    draft: SopDraft,
}

fn build_envelope(
    state: &CaptureState,
    instruction: String,
    reviewed: bool,
    reviewer_label: String,
) -> Result<SopEnvelope, String> {
    if !reviewed {
        return Err("complete teammate verification before export".into());
    }
    if reviewer_label.trim().is_empty() {
        return Err("reviewer label cannot be empty".into());
    }
    Ok(SopEnvelope {
        schema_version: "1.1",
        generated_at: Utc::now().to_rfc3339(),
        approved_by_human: true,
        review: ReviewRecord {
            status: "approved",
            reviewer_label,
            reviewed_at: Utc::now().to_rfc3339(),
        },
        draft: build_sop(state, instruction, true)?,
    })
}

#[tauri::command]
fn export_candidate(
    app: tauri::AppHandle,
    reviewed: bool,
    reviewer_label: String,
    instruction: String,
    state: State<'_, Mutex<CaptureState>>,
) -> Result<String, String> {
    let envelope = {
        let state = lock_state(&state)?;
        build_envelope(&state, instruction, reviewed, reviewer_label)?
    };
    let export_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("cannot resolve app data directory: {error}"))?
        .join("exports");
    fs::create_dir_all(&export_dir)
        .map_err(|error| format!("cannot create export directory: {error}"))?;
    let path = export_dir.join(format!("sop-{}.json", Utc::now().format("%Y%m%d-%H%M%S")));
    let json = serde_json::to_string_pretty(&envelope)
        .map_err(|error| format!("cannot serialize SOP envelope: {error}"))?;
    fs::write(&path, json).map_err(|error| format!("cannot write SOP export: {error}"))?;
    Ok(path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(CaptureState::seeded()))
        .invoke_handler(tauri::generate_handler![
            capture_snapshot,
            set_capture_enabled,
            toggle_event_selection,
            draft_sop,
            export_candidate
        ])
        .run(tauri::generate_context!())
        .expect("error while running OrgMemory Edge");
}

#[cfg(test)]
mod tests {
    use super::*;

    const INSTRUCTION: &str = "Create a training document from the last 60 minutes.";

    fn state_with_selected_evidence() -> CaptureState {
        let mut state = CaptureState::seeded();
        state.events[0].selected = true;
        state.events[1].selected = true;
        state
    }

    #[test]
    fn sop_contains_only_selected_evidence() {
        let state = state_with_selected_evidence();
        let sop =
            build_sop(&state, INSTRUCTION.into(), false).expect("seed data has selected evidence");
        let ids: Vec<_> = sop
            .evidence_links
            .iter()
            .map(|link| link.evidence_id.as_str())
            .collect();
        assert_eq!(ids, vec!["evt-001", "evt-002"]);
        assert!(!sop.systems_used.contains(&"Teams".to_string()));
        assert_eq!(sop.verification_flags[0].status, "pending");
    }

    #[test]
    fn export_requires_human_review() {
        let state = state_with_selected_evidence();
        let result = build_envelope(&state, INSTRUCTION.into(), false, "teammate".into());
        assert!(result.is_err());
    }

    #[test]
    fn approved_export_records_review_and_recipe() {
        let state = state_with_selected_evidence();
        let envelope = build_envelope(&state, INSTRUCTION.into(), true, "pilot reviewer".into())
            .expect("reviewed SOP can be exported");
        assert!(envelope.approved_by_human);
        assert_eq!(envelope.review.status, "approved");
        assert_eq!(envelope.draft.recipe.window_minutes, 60);
        assert_eq!(envelope.draft.verification_flags[0].status, "verified");
    }
}
