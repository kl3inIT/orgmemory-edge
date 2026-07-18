use chrono::Utc;
use serde::Serialize;
use std::{fs, sync::Mutex};
use tauri::{Manager, State};

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
                    selected: true,
                },
                CaptureEvent {
                    id: "evt-002".into(),
                    occurred_at: Utc::now().to_rfc3339(),
                    application: "Browser".into(),
                    window_title: "Tauri v2 — calling Rust from the frontend".into(),
                    summary: "Reviewed the command boundary for a device-local capture runtime.".into(),
                    sensitivity: "normal".into(),
                    selected: true,
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
struct SopDraft {
    title: String,
    objective: String,
    systems_used: Vec<String>,
    sections: Vec<SopSection>,
    decisions: Vec<String>,
    exceptions: Vec<String>,
    verification_flags: Vec<String>,
    evidence_ids: Vec<String>,
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

fn build_sop(state: &CaptureState) -> Result<SopDraft, String> {
    let selected: Vec<_> = state.events.iter().filter(|event| event.selected).collect();
    if selected.is_empty() {
        return Err("select at least one evidence item before drafting an SOP".into());
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
        verification_flags: vec![
            "Confirm the destination permission policy with a human owner.".into(),
        ],
        evidence_ids: selected.iter().map(|event| event.id.clone()).collect(),
    })
}

#[tauri::command]
fn draft_sop(state: State<'_, Mutex<CaptureState>>) -> Result<SopDraft, String> {
    let state = lock_state(&state)?;
    build_sop(&state)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SopEnvelope {
    schema_version: &'static str,
    generated_at: String,
    approved_by_human: bool,
    draft: SopDraft,
}

#[tauri::command]
fn export_candidate(
    app: tauri::AppHandle,
    state: State<'_, Mutex<CaptureState>>,
) -> Result<String, String> {
    let draft = {
        let state = lock_state(&state)?;
        build_sop(&state)?
    };
    let envelope = SopEnvelope {
        schema_version: "1.0",
        generated_at: Utc::now().to_rfc3339(),
        approved_by_human: true,
        draft,
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

    #[test]
    fn sop_contains_only_selected_evidence() {
        let state = CaptureState::seeded();
        let sop = build_sop(&state).expect("seed data has selected evidence");
        assert_eq!(sop.evidence_ids, vec!["evt-001", "evt-002"]);
        assert!(!sop.systems_used.contains(&"Teams".to_string()));
    }
}
