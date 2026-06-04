# Termiaxial (Tmax) — MVP2 Functional Requirement Document

**Tanggal**: 2026-05-29
**Status**: Approved
**Sumber**: MVP2_FEATURE_PROPOSAL.md + MVP2_ROADMAP.md

---

## F1: Architecture Refactoring (Sprint 0 — PREREQUISITE)

**User Flow**: N/A (internal foundation — not user-facing)

### F1.1 — Extract Domain Layer

- **Given** the codebase has business logic mixed in IPC handlers and circular dependencies between `vault/db.rs` and `commands/vault`
- **When** the domain models and error types are extracted into `domain/models.rs` and `domain/error.rs`
- **Then** no circular imports exist, and all business logic types are in `domain/` with zero external dependencies

### F1.2 — Replace std::sync with tokio::sync

- **Given** `vault/db.rs` uses `std::sync::Mutex` and `lib.rs` uses `std::sync::RwLock`
- **When** these are replaced with `tokio::sync::Mutex` and `tokio::sync::RwLock`
- **Then** no blocking mutex calls exist in async contexts, eliminating potential deadlocks

### F1.3 — Add Structured Logging (tracing)

- **Given** `println!` and `eprintln!` are scattered across 6+ Rust files
- **When** `tracing` crate is integrated and all `println!`/`eprintln!` are replaced with `tracing::info!`/`tracing::error!`/etc.
- **Then** all log output uses structured spans and the app is observable in production

### F1.4 — Structured Error Types

- **Given** all Tauri commands return `Result<_, String>`
- **When** a `TmaxError` enum is created in `domain/error.rs` with variants for Vault, SSH, SFTP, AI, and Config errors
- **Then** all commands return `Result<_, TmaxError>` and frontend can differentiate error types

### F1.5 — Extract SFTP Channel Factory

- **Given** SFTP channel setup is duplicated in `commands/sftp.rs`
- **When** a shared channel factory/pool is extracted
- **Then** SFTP channel creation is DRY and reusable for tunneling

### F1.6 — Session Cleanup on Disconnect

- **Given** `disconnect_ssh` only sends a `Disconnect` command but does not clean up `DashMap` entries or SFTP channels
- **When** a session disconnects (user-initiated or connection-lost)
- **Then** all associated resources (DashMap entry, SFTP channels, event listeners) are cleaned up

### F1.7 — SQLite WAL Mode + Migration System

- **Given** `DbManager` opens SQLite in default journal mode with ad-hoc migrations
- **When** WAL mode is enabled and a versioned migration system is added
- **Then** concurrent reads are non-blocking and schema changes are trackable

### F1.8 — Event Bus (tokio::broadcast)

- **Given** there is no mechanism for cross-component event propagation
- **When** a `tokio::sync::broadcast` event bus is added as managed state
- **Then** components (recording, UI updates, reconnect, health pings) can subscribe to session events

---

## F2: Import/Migration Wizard (RICE: 427.5 — HIGHEST)

**User Flow**: Open app -> Set master password -> Auto-detect ~/.ssh/config -> Review detected hosts -> Select which to import -> Import -> Hosts appear in vault -> Connect

### F2.1 — SSH Config Parser

- **Given** a user has an existing ~/.ssh/config file
- **When** the Import Wizard is opened
- **Then** the app auto-detects and parses ~/.ssh/config, extracting Host, HostName, User, Port, IdentityFile entries

### F2.2 — SSH Keys Scanner

- **Given** a user has SSH keys in ~/.ssh/ directory
- **When** the Import Wizard scans for keys
- **Then** it lists all .pub key files and their associated private keys, showing key type and fingerprint

### F2.3 — Import to Vault

- **Given** the user has reviewed detected hosts and keys
- **When** they click "Import Selected"
- **Then** selected hosts are converted to Credential entries and stored encrypted in the vault, with key references preserved

### F2.4 — Termius JSON Import

- **Given** a user exports their Termius data as JSON
- **When** they select "Import from Termius" and provide the JSON file
- **Then** Termius host entries are parsed and imported as Credentials in the vault

### F2.5 — Import Wizard UI

- **Given** the app is freshly installed or the user opens Settings > Import
- **When** the Import Wizard is displayed
- **Then** it shows: auto-detected sources, parsed host list with checkboxes, progress indicator, and import result summary

---

## F3: Cross-Session Command History (RICE: 403.75)

**User Flow**: User types commands in terminal -> Commands are recorded -> User opens history panel -> Searches across sessions -> Selects command -> Re-executes or copies

### F3.1 — Command History Storage

- **Given** a terminal session is active
- **When** a command is submitted (detected by newline on prompt)
- **Then** the command text, session_id, timestamp, and exit_code are stored in SQLite command_history table

### F3.2 — Command History Search

- **Given** command history entries exist
- **When** the user opens the history panel and types a search query
- **Then** matching commands across all sessions are displayed within 50ms, sorted by recency

### F3.3 — Command Re-execution

- **Given** a command is displayed in history
- **When** the user clicks "Re-run" or presses Enter on a history entry
- **Then** the command is sent to the active terminal session

### F3.4 — History UI

- **Given** the user opens the history panel (sidebar or shortcut)
- **When** the panel is displayed
- **Then** it shows: searchable list, session filter, date filter, and each entry shows command + timestamp + host

---

## F4: SSH Config Compatibility (RICE: 378)

**User Flow**: User adds/edits a credential in Tmax vault -> Change is written to ~/.ssh/config -> User edits ~/.ssh/config externally -> Tmax detects change and updates vault

### F4.1 — Write to SSH Config

- **Given** a credential is added or updated in the vault
- **When** bidirectional sync is enabled
- **Then** the corresponding ~/.ssh/config entry is created/updated without destroying manual entries

### F4.2 — Read from SSH Config (Bidirectional)

- **Given** ~/.ssh/config is modified externally
- **When** the app detects the change (on startup or manual refresh)
- **Then** vault entries are updated to reflect the change, with conflict resolution prompting the user

### F4.3 — SSH Config Sync UI

- **Given** the user opens Settings > SSH Config
- **When** the sync panel is displayed
- **Then** it shows: sync status, last sync time, conflicts (if any), and manual sync trigger

---

## F5: SSH Tunneling (RICE: 178.5)

**User Flow**: User selects a connected session -> Opens Tunnel panel -> Configures tunnel (type, ports) -> Starts tunnel -> Status indicator shows active -> Uses forwarded port

### F5.1 — Local Port Forwarding (-L)

- **Given** an SSH session is active
- **When** the user creates a local forwarding tunnel (local_port -> remote_host:remote_port)
- **Then** the tunnel is established via russh direct-tcpip channel and TCP listener on local_port

### F5.2 — Remote Port Forwarding (-R)

- **Given** an SSH session is active
- **When** the user creates a remote forwarding tunnel
- **Then** the tunnel is established via russh tcpip-forward request

### F5.3 — Dynamic SOCKS5 Proxy (-D)

- **Given** an SSH session is active
- **When** the user creates a dynamic proxy on a local port
- **Then** a SOCKS5 proxy is established using tokio TCP listener

### F5.4 — Tunnel Management UI

- **Given** tunnels are active or configured
- **When** the Tunnel panel is opened
- **Then** it shows: list of tunnels per session, type indicator, local/remote ports, bytes transferred, active/inactive status, start/stop controls

### F5.5 — Tunnel Config Persistence

- **Given** the user has configured tunnel settings
- **When** they save the tunnel config
- **Then** tunnel settings are persisted per credential in the vault and auto-started on reconnect

---

## F6: Snippet Manager (RICE: 180)

**User Flow**: User creates snippet -> Tags it -> Opens command palette (Ctrl+K) -> Searches -> Selects -> Variable interpolation prompt appears -> Command sent to terminal

### F6.1 — Snippet CRUD Backend

- **Given** the user is in the Snippet Manager
- **When** they create, edit, or delete a snippet
- **Then** the snippet (name, command, description, tags, scope) is stored in SQLite snippets table

### F6.2 — Fuzzy Search

- **Given** snippets exist in the database
- **When** the user types in the command palette
- **Then** matching snippets are returned within 50ms using fuzzy matching

### F6.3 — Variable Interpolation

- **Given** a snippet contains {VARIABLE} placeholders
- **When** the snippet is selected for execution
- **Then** a prompt dialog appears for each variable, and after filling, the interpolated command is sent to the active terminal

### F6.4 — Snippet Palette UI

- **Given** the user presses Ctrl+K
- **When** the command palette modal opens
- **Then** it shows: search input, fuzzy-matched snippet list, preview of selected snippet, and keyboard navigation

---

## F7: Session Recording (RICE: 120)

**User Flow**: User clicks Record button -> Session output is captured -> User clicks Stop -> .cast file saved -> User can replay

### F7.1 — Recording Backend

- **Given** a terminal session is active
- **When** the user starts recording
- **Then** all terminal output is buffered and written to a .cast file in asciinema v2 format

### F7.2 — Recording Controls UI

- **Given** a terminal session is active
- **When** the recording state is toggled
- **Then** a REC indicator appears in the topbar, and the record button toggles between start/stop

### F7.3 — Recording File Management

- **Given** a recording is completed
- **When** the user stops recording
- **Then** a save dialog appears to choose file location, and the .cast file is valid per asciinema v2 spec

---

## F8: Auto-Reconnect (RICE: 110)

**User Flow**: SSH connection drops -> Tmax detects -> Shows reconnecting indicator -> Attempts reconnect with exponential backoff -> Reconnects or shows failure

### F8.1 — Reconnect Logic

- **Given** an SSH session disconnects unexpectedly
- **When** the event bus detects a connection-lost event
- **Then** the app attempts to reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s), up to 5 attempts

### F8.2 — Reconnect UI

- **Given** a reconnect attempt is in progress
- **When** the terminal view is displayed
- **Then** it shows a "Reconnecting... (attempt N/5)" overlay with a cancel button

---

## F9: Theme System (RICE: 102)

**User Flow**: User opens Settings > Themes -> Selects a theme -> Terminal and UI update immediately

### F9.1 — Theme Engine

- **Given** the app supports CSS-variable-based theming
- **When** a theme JSON is loaded
- **Then** CSS variables are applied to both the terminal (xterm.js theme) and the UI shell

### F9.2 — Theme Selection UI

- **Given** the user opens Settings > Themes
- **When** the theme panel is displayed
- **Then** it shows: preview of available themes, currently active theme, and a "Custom" option for manual CSS variable editing

---

## F10: Fix Blocking Issues

### F10.1 — Remove Duplicate xterm Dependency

- **Given** package.json has both xterm: ^5.3.0 and @xterm/xterm: ^6.0.0
- **When** the duplicate is removed
- **Then** only @xterm/xterm v6 remains, eliminating type conflicts

### F10.2 — Implement Real SSH Keepalive

- **Given** the current keepalive only checks handle.is_closed()
- **When** proper SSH_MSG_IGNORE keepalive packets are implemented
- **Then** long-running connections stay alive through firewall/NAT timeouts

---

## Task Breakdown

| # | Task ID | Description | Expected Output Files | Dependencies | Sprint |
|---|---------|-------------|----------------------|--------------|--------|
| 1 | T01-ARCH-DOMAIN | Extract domain models and TmaxError enum into domain/models.rs and domain/error.rs. Update all imports. | domain/models.rs, domain/error.rs, domain/mod.rs, updated imports | None | 0 |
| 2 | T02-ARCH-ASYNC | Replace std::sync::Mutex/RwLock with tokio::sync equivalents. Update all lock patterns. | Updated vault/db.rs, lib.rs, commands/vault.rs | T01 | 0 |
| 3 | T03-ARCH-TRACING | Add tracing crate. Replace all println!/eprintln! with tracing macros. Initialize in main. | Updated Cargo.toml, all .rs files, infrastructure/logging.rs | T01 | 0 |
| 4 | T04-ARCH-ERRORS | Implement TmaxError enum with variants. Update all Result<_, String> to Result<_, TmaxError>. | domain/error.rs, updated all commands/*.rs | T01 | 0 |
| 5 | T05-ARCH-SFTP-FACTORY | Extract SFTP channel creation into shared factory. Deduplicate in sftp.rs. | ssh/sftp_channel.rs, updated commands/sftp.rs | T01 | 0 |
| 6 | T06-ARCH-SESSION-CLEANUP | Full cleanup on disconnect: DashMap removal, SFTP channels, event listeners. | Updated commands/ssh.rs, commands/sftp.rs | T01 | 0 |
| 7 | T07-ARCH-WAL-MIGRATION | Enable SQLite WAL mode. Versioned migration system with _migrations table. | Updated vault/db.rs, infrastructure/db.rs, infrastructure/mod.rs | T02 | 0 |
| 8 | T08-ARCH-EVENT-BUS | Add tokio::sync::broadcast as managed state. Define SessionEvent enum. Emit from SSH loop. | domain/events.rs, updated lib.rs, commands/ssh.rs | T01 | 0 |
| 9 | T09-FIX-XTERM-DUP | Remove xterm v5 from package.json. Update frontend imports. Run npm install. | Updated package.json, frontend imports | None | 0 |
| 10 | T10-FIX-KEEPALIVE | Implement SSH_MSG_IGNORE keepalive every 30s. Replace is_closed() check. | Updated ssh/session.rs, commands/ssh.rs | T01 | 0 |
| 11 | T11-IMPORT-SSHCONFIG-PARSER | Parse ~/.ssh/config. Extract Host, HostName, User, Port, IdentityFile. | commands/import.rs (parser) | T01, T04 | 1 |
| 12 | T12-IMPORT-KEYS-SCANNER | Scan ~/.ssh/ for key files. Read .pub for type/fingerprint. Map private to public. | Updated commands/import.rs | T11 | 1 |
| 13 | T13-IMPORT-TERMUS | Parse Termius JSON export. Map to Credential structs. | Updated commands/import.rs | T11 | 1 |
| 14 | T14-IMPORT-VAULT-INTEGRATION | Create Tauri commands: import_detect_sources, import_ssh_config, import_keys, import_termius. Wire to vault. | Updated commands/import.rs, commands/mod.rs, lib.rs | T11, T12, T13 | 1 |
| 15 | T15-IMPORT-WIZARD-UI | Build Import Wizard modal: auto-detect, host list with checkboxes, progress, summary. | components/import/ImportWizard.tsx, stores, sub-components | T14 | 1 |
| 16 | T16-CMDHIST-STORAGE | Create command_history table. Add history_record/list/search/clear commands. | commands/history.rs, updated vault/db.rs, lib.rs | T07 | 1 |
| 17 | T17-CMDHIST-DETECTION | Detect command boundaries in SSH stream. Record via Tauri IPC from frontend. | hooks/use-command-history.ts, updated TerminalView.tsx | T16 | 1 |
| 18 | T18-CMDHIST-UI | Build History panel: searchable list, session filter, date filter, re-run button. | components/history/HistoryPanel.tsx, stores | T16 | 1 |
| 19 | T19-SSHCONFIG-WRITE | Write vault changes to ~/.ssh/config. Preserve non-Tmax entries. Add # Tmax-managed marker. | commands/ssh_config.rs (write) | T11 | 1 |
| 20 | T20-SSHCONFIG-READ-SYNC | Detect external config changes. Parse diffs. Update vault. Conflict resolution. | Updated ssh_config.rs, Tauri commands for sync | T19 | 1 |
| 21 | T21-SSHCONFIG-SYNC-UI | Build sync settings panel: status, last sync, conflicts, manual trigger. | components/settings/SshConfigSync.tsx, stores | T20 | 1 |
| 22 | T22-TUNNEL-LOCAL | Implement local port forwarding (-L) via russh direct-tcpip. Add SshCommand::Tunnel variant. | commands/tunnel.rs, updated ssh/session.rs, lib.rs | T01, T05, T08 | 2 |
| 23 | T23-TUNNEL-REMOTE | Implement remote port forwarding (-R) via russh tcpip-forward. | Updated commands/tunnel.rs | T22 | 2 |
| 24 | T24-TUNNEL-SOCKS5 | Implement dynamic SOCKS5 proxy (-D) using tokio TCP listener. | Updated commands/tunnel.rs | T22 | 2 |
| 25 | T25-TUNNEL-MGMT | Add list_tunnels, close_tunnel, tunnel_status commands. Track bytes. Persist configs. | Updated commands/tunnel.rs, updated vault/db.rs (tunnel_configs table) | T22, T23, T24 | 2 |
| 26 | T26-TUNNEL-UI | Build Tunnel panel: list, add/edit form, status indicator, bytes, start/stop. | components/tunnel/TunnelPanel.tsx, TunnelForm.tsx, TunnelStatus.tsx, stores | T25 | 2 |
| 27 | T27-SNIPPET-CRUD | Create snippets table. Add snippet_add/list/delete/update/search commands. | commands/snippet.rs, commands/mod.rs, lib.rs, updated vault/db.rs | T07 | 2 |
| 28 | T28-SNIPPET-FUZZY | Implement fuzzy search for snippets using nucleo. Sub-50ms response. | Updated commands/snippet.rs, Cargo.toml (add nucleo) | T27 | 2 |
| 29 | T29-SNIPPET-INTERPOLATION | Implement variable interpolation: detect {VAR} patterns. Prompt for values. Substitute. | Updated commands/snippet.rs | T27 | 2 |
| 30 | T30-SNIPPET-PALETTE-UI | Build SnippetPalette.tsx modal (Ctrl+K): search, fuzzy list, preview, keyboard nav. Variable prompt. | components/snippet/SnippetPalette.tsx, SnippetManager.tsx, VariablePrompt.tsx, stores | T28, T29 | 2 |
| 31 | T31-RECORDING-BACKEND | Create recording module: start/stop_recording. Subscribe to event bus. Write asciinema v2 .cast files. | commands/recording.rs, commands/mod.rs, lib.rs | T08 | 3 |
| 32 | T32-RECORDING-UI | Add Record button to Topbar. REC indicator. Save dialog on stop. | components/recording/RecordButton.tsx, RecordingIndicator.tsx, stores, updated Topbar.tsx | T31 | 3 |
| 33 | T33-AUTORECONNECT | Implement reconnect logic: exponential backoff (1-30s, 5 attempts). Re-establish PTY and tunnels. | Updated ssh/session.rs, commands/ssh.rs | T08, T06 | 3 |
| 34 | T34-AUTORECONNECT-UI | Show reconnecting overlay on terminal. Cancel button. Restore terminal on success. | components/terminal/ReconnectOverlay.tsx, updated TerminalView.tsx | T33 | 3 |
| 35 | T35-THEME-ENGINE | Create theme system: JSON theme schema, CSS variables + xterm.js ITheme. Persist in settings. | commands/theme.rs (or frontend-only), styles/themes/, stores/theme-store.ts | None | 2 |
| 36 | T36-THEME-UI | Build Theme settings panel: preview cards, click to apply, active indicator, custom editor. 3 built-in themes. | components/settings/ThemeSettings.tsx, styles/themes/dark.json, light.json, dracula.json | T35 | 2 |

---

## Execution Batches (Max Concurrent = 2)

| Batch | Task 1 | Task 2 | Rationale |
|-------|--------|--------|-----------|
| 1 | T01-ARCH-DOMAIN | T09-FIX-XTERM-DUP | Foundation + independent quick fix |
| 2 | T02-ARCH-ASYNC | T03-ARCH-TRACING | Both depend on T01, no file overlap |
| 3 | T04-ARCH-ERRORS | T10-FIX-KEEPALIVE | Both depend on T01, different files |
| 4 | T05-ARCH-SFTP-FACTORY | T06-ARCH-SESSION-CLEANUP | Both depend on T01, different modules |
| 5 | T07-ARCH-WAL-MIGRATION | T08-ARCH-EVENT-BUS | T07 depends on T02, T08 on T01 |
| 6 | T11-IMPORT-SSHCONFIG-PARSER | T35-THEME-ENGINE | T11 on T01/T04, T35 independent |
| 7 | T12-IMPORT-KEYS-SCANNER | T27-SNIPPET-CRUD | T12 on T11, T27 on T07 |
| 8 | T13-IMPORT-TERMUS | T16-CMDHIST-STORAGE | T13 on T11, T16 on T07 |
| 9 | T14-IMPORT-VAULT-INTEGRATION | T28-SNIPPET-FUZZY | T14 on T11-T13, T28 on T27 |
| 10 | T15-IMPORT-WIZARD-UI | T29-SNIPPET-INTERPOLATION | T15 on T14, T29 on T27 |
| 11 | T17-CMDHIST-DETECTION | T19-SSHCONFIG-WRITE | T17 on T16, T19 on T11 |
| 12 | T18-CMDHIST-UI | T20-SSHCONFIG-READ-SYNC | T18 on T16, T20 on T19 |
| 13 | T21-SSHCONFIG-SYNC-UI | T30-SNIPPET-PALETTE-UI | T21 on T20, T30 on T28/T29 |
| 14 | T22-TUNNEL-LOCAL | T31-RECORDING-BACKEND | T22 on T05/T08, T31 on T08 |
| 15 | T23-TUNNEL-REMOTE | T32-RECORDING-UI | T23 on T22, T32 on T31 |
| 16 | T24-TUNNEL-SOCKS5 | T33-AUTORECONNECT | T24 on T22, T33 on T08/T06 |
| 17 | T25-TUNNEL-MGMT | T34-AUTORECONNECT-UI | T25 on T22-T24, T34 on T33 |
| 18 | T26-TUNNEL-UI | T36-THEME-UI | T26 on T25, T36 on T35 |

---

## Dependency Graph

```
T01 (DOMAIN)
   +-> T02 (ASYNC) -> T07 (WAL/MIGRATION) -> T16 (CMDHIST-DB)
   |                                    +-> T27 (SNIPPET-DB)
   |                                    +-> T25 (TUNNEL-MGMT)
   +-> T03 (TRACING)
   +-> T04 (ERRORS) -> T11 (SSHCONFIG PARSER) -> T12 (KEYS)
   |                                    +-> T13 (TERMUS)
   |                                    +-> T19 (SSHCONFIG WRITE) -> T20 (BIDI SYNC) -> T21 (UI)
   +-> T05 (SFTP FACTORY) -> T22 (TUNNEL-LOCAL) -> T23 (REMOTE)
   |                                    +-> T24 (SOCKS5)
   +-> T06 (SESSION CLEANUP) -> T33 (AUTORECONNECT) -> T34 (UI)
   +-> T08 (EVENT BUS) -> T31 (RECORDING) -> T32 (RECORDING UI)
   |                    +-> T22 (TUNNEL)
   +-> T10 (KEEPALIVE)

T09 (XTERM DUP) -- independent
T35 (THEME ENGINE) -> T36 (THEME UI) -- independent

T11-T14 -> T15 (IMPORT WIZARD UI)
T16 -> T17 (HIST DETECTION) -> T18 (HIST UI)
T22-T25 -> T26 (TUNNEL UI)
T27-T29 -> T30 (SNIPPET PALETTE UI)
```
