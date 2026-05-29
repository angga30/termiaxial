# Termiaxial (Tmax) — MVP2 Unified Feature Proposal

**Tanggal**: 2026-05-29
**Sumber**: Diskusi mendalam 3 subagent (Marketing, Product, Engineering)
**Status**: Draft — Needs team review & prioritization

---

## Ringkasan Eksekutif

Setelah analisis mendalam dari perspektif Marketing, Product, dan Engineering, ada **3 critical gaps** yang harus ditangani SEBELUM MVP2 features:

1. **Import/Migration Wizard** — Tanpa ini, zero net-new adoption. #1 switching blocker.
2. **Cross-Session Command History** — Feature yang expected tapi tidak ada. RICE score tertinggi kedua.
3. **Architecture Refactoring** — Codebase score 3/10. Tanpa domain layer, setiap fitur baru 30-50% lebih lambat dibangun.

Dengan perbaikan ini + fitur MVP2 yang direvisi + fitur baru yang dipropose, Tmax bisa bertransformasi dari "SSH client ringan" menjadi **SSH Productivity Platform** — kategori yang belum dimiliki siapapun.

---

## 1. Positioning Revisi

### Sebelum
> "Ultra-lightweight SSH client — 1/10 RAM of Electron alternatives"

**Masalah**: Ini adalah feature, bukan positioning. Market tidak punya kategori "lightweight SSH client".

### Sesudah (Proposed)
> **"Untuk developer yang hidup di SSH, Tmax adalah SSH Productivity Platform yang berjalan di 1/10 resource Electron — dengan AI autocomplete, zero-knowledge sync, dan vault yang bahkan kami tidak bisa baca."**

### Kategori Baru: SSH Productivity Platform

| Komponen | Jawaban |
|----------|---------|
| Competitive Alternatives | Termius (primary), PuTTY (legacy), terminal+ssh config (default) |
| Unique Attributes | Rust-native 1/10 RAM, zero-knowledge E2E sync, AI autocomplete IN terminal, asciinema recording, open-source MIT |
| Best-Fit Customers | DevOps/SRE yang keep SSH open 8+ jam/hari; security-conscious engineers |
| Market Category | SSH Productivity Platform |
| Relevant Trends | Developer tools going local-first, AI copilot everywhere, Electron fatigue, Rust renaissance |

---

## 2. Competitive Differentiator Map

| Rank | Differentiator | Kenapa "Obviously Awesome" | Gap Kompetitor |
|------|---------------|---------------------------|----------------|
| 1 | **AI Autocomplete IN terminal** | Copilot untuk SSH — ghost text saat mengetik. Nobody else does this. | Termius: no AI. Warp: AI tapi bukan SSH. Unique. |
| 2 | **Zero-Knowledge Sync @ $4/mo** | Termius Pro = $10/mo DAN mereka bisa baca vault. Tmax = $4/mo DAN kita TIDAK BISA. | Double win: cheaper + more private |
| 3 | **50MB RAM vs 200MB+** | Measurable, provable, visual. Screenshot Activity Monitor = viral. | Termius/MobaXterm can never fix without rewrite |
| 4 | **Asciinema session recording** | One-click record, shareable `.cast` files. DevOps need audit/compliance. | No SSH client has this built-in |
| 5 | **Open-source + MIT** | Self-host sync server. Audit the crypto. No vendor lock-in. | Termius is closed-source |

---

## 3. Critical Gaps yang Harus Ditangani DULU

### 3.1 Import/Migration Wizard (RICE: 427.5 — HIGHEST)

**Kenapa critical**: Setiap new user harus re-enter semua hosts manually. #1 switching friction.

| Source | Effort | Priority |
|--------|--------|----------|
| `~/.ssh/config` auto-detect & parse | 2 hari | P0 |
| `~/.ssh/` keys scan & import | 1 hari | P0 |
| Termius JSON export parser | 2 hari | P1 |
| PuTTY sessions (Windows Registry) | 2 hari | P1 |
| MobaXterm sessions | 1.5 hari | P2 |

**Target flow**: Open app → Set master password → Auto-detect `~/.ssh/config` → Import → Connect (3 steps, ~15 detik)

### 3.2 Cross-Session Command History (RICE: 403.75)

**Kenapa critical**: Setiap terminal punya ini. Tmax tidak. User expected banget.

- SQLite table: `command_history (session_id, command, timestamp, exit_code)`
- Searchable across all sessions
- Basis data untuk AI autocomplete context
- **Effort**: 1-2 hari

### 3.3 SSH Config Compatibility (RICE: 378)

**Kenapa critical**: `~/.ssh/config` adalah lingua franca SSH. Read + write = full interoperability.

- Parse via `ssh2-config` crate
- Bidirectional sync: Tmax vault ↔ `~/.ssh/config`
- Makes Tmax a **credential management hub**, bukan hanya terminal
- **Effort**: 1-2 hari

---

## 4. Architecture Refactoring (PREREQUISITE)

### Score Saat Ini: 3/10

| Masalah | Lokasi | Impact |
|---------|--------|--------|
| Circular dependency | `vault/db.rs` imports dari `commands/vault` | Domain model di layer salah |
| Missing domain layer | No `models/` atau `domain/` | Business logic di IPC handlers |
| Blocking mutex di async | `std::sync::Mutex/RwLock` | Potential deadlocks |
| SFTP channel duplication | 4x identical channel setup | Change amplification |
| No structured errors | `Result<_, String>` everywhere | Frontend cannot handle errors |
| No logging | `println!` scattered | Not observable in production |
| Session leak | Disconnect tanpa cleanup | Resource leaks |

### Proposed Clean Architecture

```
src-tauri/src/
├── domain/                    # ENTITIES — no external deps
│   ├── models.rs              # Credential, Workspace, Session, Tunnel, Snippet
│   ├── error.rs               # TmaxError enum (structured)
│   └── events.rs              # Domain events
│
├── usecases/                  # USE CASES — depend only on domain
│   ├── ssh/                   # connect, disconnect, tunnel, broadcast
│   ├── vault/                 # setup, unlock, add_credential, sync
│   ├── sftp/                  # transfer, browse
│   └── ai/                    # analyze, autocomplete
│
├── ports/                     # INTERFACES — defined by use cases
│   ├── ssh_repo.rs
│   ├── vault_repo.rs
│   └── ai_provider.rs
│
├── adapters/                  # IMPLEMENTATIONS
│   ├── russh_ssh.rs
│   ├── sqlite_vault.rs
│   ├── ring_crypto.rs
│   ├── openai_provider.rs
│   └── tauri_ipc.rs           # Thin command handlers
│
├── infrastructure/            # CROSS-CUTTING
│   ├── logging.rs             # tracing setup
│   ├── config.rs
│   └── db.rs                  # Connection pool, WAL mode
│
└── lib.rs                     # Composition root
```

### Refactoring Priorities (5 hari — INVESTASI STRATEGIS)

| Priority | Task | Effort | Unlocks |
|----------|------|--------|---------|
| P0 | Extract `domain/models.rs` + `domain/error.rs` | 1 hari | All features testable |
| P0 | Replace `std::sync` → `tokio::sync` | 0.5 hari | Deadlock prevention |
| P0 | Add `tracing` crate, replace `println!` | 0.5 hari | Production observability |
| P1 | Extract SFTP channel factory (DRY 4x duplication) | 1 hari | SFTP reliability, tunnel reuse |
| P1 | Structured error types | 1 hari | Frontend meaningful errors |
| P1 | Session cleanup on disconnect | 0.5 hari | Resource leak prevention |
| P2 | AI settings → separate `settings` table | 0.5 hari | Clean domain separation |
| P2 | SQLite WAL mode + migration system | 0.5 hari | Data integrity |

---

## 5. MVP2 Features — Re-scored & Re-prioritized

### RICE Scores (Marketing + Product + Engineering consensus)

| # | Feature | Reach | Impact | Confidence | Effort | RICE | Risk |
|---|---------|-------|--------|------------|--------|------|------|
| 1 | TUI Research & Fix | 90% | 2 | 95% | 0.3 | **570** | 2 |
| 2 | Import/Migration Wizard | 95% | 3 | 90% | 0.6 | **427.5** | 1 |
| 3 | Cross-Session Command History | 85% | 2 | 95% | 0.4 | **403.75** | 1 |
| 4 | SSH Config Compatibility | 70% | 3 | 90% | 0.5 | **378** | 1 |
| 5 | Snippet Manager | 80% | 2 | 90% | 0.8 | **180** | 2 |
| 6 | SSH Tunneling | 70% | 3 | 85% | 1.0 | **178.5** | 4 |
| 7 | Session Recording | 40% | 2 | 75% | 0.5 | **120** | 3 |
| 8 | Auto-reconnect | 55% | 2 | 80% | 0.8 | **110** | 2 |
| 9 | Theme System | 60% | 1 | 85% | 0.5 | **102** | 1 |
| 10 | Status Notes per Host | 40% | 1 | 70% | 0.3 | **93.3** | 1 |
| 11 | Port Forward Dashboard | 45% | 2 | 70% | 0.8 | **78.75** | 2 |
| 12 | Split Panes | 55% | 2 | 80% | 1.5 | **58.7** | 3 |
| 13 | AI Autocomplete | 50% | 2 | 60% | 1.2 | **50** | 4 |

### Table Stakes vs Delighters

```
                    HIGH Impact
                        |
   +--------------------+--------------------+
   |  TABLE STAKES      |   DELIGHTERS       |
   |  (must have)       |   (love to have)   |
   |                    |                     |
   |  - Import Wizard   |  - Session Record   |
   |  - Command History |  - AI Autocomplete  |
   |  - SSH Config      |  - Theme System     |
   |  - TUI Support     |  - Status Notes     |
   |  - SSH Tunneling   |  - Credential Rot.  |
   |                    |                     |
   +--------------------+--------------------+
   |  BASIC             |   LOW PRIORITY      |
   |  (expected)        |   (nice to have)    |
   |                    |                     |
   |  - Split Panes     |  - Team Vault       |
   |  - Snippet Manager |  - Session Handoff  |
   |  - Health Pings    |  - Scripting API    |
   |  - Auto-reconnect  |  - Kube Exec        |
   +--------------------+--------------------+
                    LOW Impact
```

---

## 6. Fitur BARU yang Dipropose (Konsensus 3 Perspektif)

### 6.1 Marketing-Driven Features

| Feature | Viral Mechanism | Effort | Priority |
|---------|----------------|--------|----------|
| **One-Click Benchmark Share** | Built-in RAM/CPU benchmark vs Termius, auto-generate shareable image | 2 hari | **P0** |
| **Snippet Sharing (JSON export)** | "Docker Commands Pack" — colleagues share internally. Network effect. | 3 hari | **P0** |
| **Asciinema + One-Click Upload** | Record → upload → share link. "Here's how I debugged that" | 2 hari | **P0** |
| **`tmax` CLI Quick Connect** | `tmax ssh prod-api` from any terminal | 3 hari | P1 |
| **Theme/Skin System** | CSS-based themes, community-driven, one-click install | 3 hari | P1 |

### 6.2 Product-Driven Features

| Feature | JTBD | RICE | Priority |
|---------|------|------|----------|
| **Import/Migration Wizard** | "Help me get started in 30 seconds" | 427.5 | **P0** |
| **Command History** | "Help me remember what I did yesterday" | 403.75 | **P0** |
| **SSH Config Compat** | "Help me use my existing setup" | 378 | **P0** |
| **Health Check Pings** | "Know when something's wrong without staring" | 150 | P1 |
| **Workspace Presets** | "Save tab layouts per project" | ~120 | P1 |
| **Status Notes per Host** | "Leave warnings so nobody breaks things" | 93.3 | P2 |
| **Credential Rotation Reminders** | "Know which credentials are stale" | 45.5 | P2 |

### 6.3 Engineering-Driven Features

| Feature | Kenapa Rust Unique | Effort | Risk | Priority |
|---------|-------------------|--------|------|----------|
| **Parallel SSH / Command Broadcasting** | tokio zero-cost async, ownership prevents data races | 3-4 hari | 2 | **P1** |
| **Tmaxfile (Config-as-Code)** | `toml` crate best-in-class, parse at compile time | 3-4 hari | 2 | P1 |
| **SSH Config Generation/Management** | Bidirectional sync vault ↔ ssh config | 1-2 hari | 1 | **P0** |
| **Performance Profiling StatusBar** | `sysinfo` crate, bandwidth tracking | 2-3 hari | 2 | P1 |
| **Event Bus (tokio::broadcast)** | Unlocks recording, UI updates, plugins, reconnect | 2 hari | 1 | **P0** (infra) |

### 6.4 Features yang TIDAK Dibangun (Consensus)

| Feature | Kenapa Ditolak | Alternative |
|---------|---------------|-------------|
| Terminal Multiplexer (embedded tmux) | Effort 15-20 hari, risk 5/5 | Proper tmux passthrough via TUI fix |
| Local Credential Proxy | Security risk (vault secrets in process memory) | SSH config generation covers 80% use case |
| Plugin System (WASM) | Post-MVP2 scope, needs stable API first | Scripting via Tmaxfile + snippets |
| Session Handoff (live sharing) | Effort 2.5 minggu, low RICE | Asciinema recording + sharing |

---

## 7. Pricing & Monetization Strategy (Revised)

### Masalah dengan Free Tier Saat Ini

Free tier (2 devices, 500 records, 5-min sync) **terlalu generous** — solo dev tidak pernah perlu upgrade.

### Revised Free/Pro Tier

| Feature | Free (Local-First) | Pro ($4/mo atau $36/yr) |
|---------|-------------------|------------------------|
| SSH + Terminal | Unlimited | Unlimited |
| SFTP | Unlimited | Unlimited |
| Local Vault (AES-GCM-256) | Unlimited hosts | Unlimited hosts |
| AI Assistant (explain output) | 10 queries/day | Unlimited |
| AI Autocomplete | 50 completions/day | Unlimited + priority model |
| Snippet Manager | 10 snippets (local only) | Unlimited + cloud sync |
| SSH Tunneling | Manual entry per session | Saved presets + cloud sync |
| Session Recording | Local `.cast` files, 7-day retention | Cloud storage + team sharing |
| Cloud Sync | **None** (local-only vault) | Real-time E2E sync |
| Devices | 1 | Unlimited |
| Import/Migration | Unlimited | Unlimited |
| Command History | 30 days | Unlimited |

### 5 Upgrade Triggers

1. Dapat device ke-2 → needs sync → Pro
2. Hit 50 AI completions → needs more → Pro
3. Wants 11th snippet → Pro
4. Wants saved tunnel configs → Pro
5. Team needs session recordings → Pro

### Additional Revenue Streams (Post-Pro)

| Stream | Model | Potential | Effort |
|--------|-------|-----------|--------|
| Team Plan ($8/user/mo) | Shared vault, RBAC, audit logs, SSO | HIGH | 20-25 hari |
| Self-Hosted Sync Server | $99 one-time atau $5/mo managed | Enterprise/compliance | 5 hari |
| AI Model Hosting | $2/mo add-on, no BYOK needed | Low friction for non-tech | 7 hari |
| Snippet Marketplace | Revenue share on premium packs | Community-driven growth | 10-15 hari |

**Pricing philosophy**: Gate by VALUE, not by COST. Core connectivity = ALWAYS FREE. AI = FREEMIUM. Sync/Collaboration = PAID ONLY. Security = NEVER gated.

---

## 8. Implementation Roadmap (Revised)

### Sprint 0: Architecture Refactoring (5 hari)

```
Hari 1:   Extract domain/models.rs + domain/error.rs
Hari 2:   Replace std::sync -> tokio::sync + add tracing
Hari 3:   Extract SFTP channel factory + structured errors
Hari 4:   Session cleanup + auto-reconnect foundation
Hari 5:   SQLite WAL mode + migration system + event bus
```

### Sprint 1: Critical Gaps (7 hari)

```
Hari 1-2: TUI Research & Fix (xterm.js audit, mouse passthrough, alternate screen)
Hari 3-4: Import/Migration Wizard (~/.ssh/config, keys, Termius)
Hari 5:   Cross-Session Command History
Hari 6:   SSH Config Compatibility (bidirectional)
Hari 7:   Performance StatusBar (RAM, bandwidth, connection count)
```

### Sprint 2: MVP2 Core Features (10 hari)

```
Hari 1-3: SSH Tunneling (Local/Remote port forwarding)
Hari 4-5: SSH Tunneling (Dynamic SOCKS5 + Port Forward Dashboard)
Hari 6-8: Snippet Manager (CRUD, fuzzy search, variable interpolation, command palette)
Hari 9:   Theme System (JSON themes, community gallery foundation)
Hari 10:  One-Click Benchmark Share
```

### Sprint 3: AI & Recording (8 hari)

```
Hari 1-3: Session Recording (asciinema v2, UI controls, one-click upload)
Hari 4-6: AI Autocomplete (ghost text, history context, debounce)
Hari 7:   Auto-reconnect with exponential backoff
Hari 8:   Status Notes per Host + Workspace Presets
```

### Sprint 4: Growth Features (7 hari)

```
Hari 1-2: Snippet Sharing (JSON export/import + URL sharing)
Hari 3-4: Parallel SSH / Command Broadcasting
Hari 5-6: Tmaxfile (Config-as-Code)
Hari 7:   Health Check Pings + Credential Rotation Reminders
```

### Total: 37 hari (~7.5 minggu)

---

## 9. Dependency Graph (Revised)

```
Sprint 0: Architecture Refactoring
    |
    +--> Sprint 1: Critical Gaps
    |       |
    |       +--> TUI Fix (foundation for all terminal features)
    |       +--> Import Wizard (foundation for growth)
    |       +--> Command History (foundation for AI autocomplete)
    |       +--> SSH Config Compat (foundation for credential hub)
    |
    +--> Sprint 2: MVP2 Core
    |       |
    |       +--> SSH Tunneling (needs: SFTP channel factory refactor)
    |       +--> Snippet Manager (needs: Command History DB)
    |       +--> Theme System (needs: clean domain separation)
    |       +--> Benchmark Share (needs: Performance StatusBar)
    |
    +--> Sprint 3: AI & Recording
    |       |
    |       +--> Session Recording (needs: Event Bus)
    |       +--> AI Autocomplete (needs: Command History + TUI Fix)
    |       +--> Auto-reconnect (needs: Event Bus + Session cleanup)
    |
    +--> Sprint 4: Growth
            |
            +--> Snippet Sharing (needs: Snippet Manager)
            +--> Parallel SSH (needs: Clean session management)
            +--> Tmaxfile (needs: SSH Config Compat)
            +--> Health Pings (needs: Event Bus)
```

---

## 10. Viral Growth Engine — Snippet Sharing Loop

Ini adalah **single most important viral feature**:

```
Developer A creates "Docker Cleanup Commands" snippet pack
    |
    +-- Exports as JSON -> shares in team Slack
    |       |
    |       +-- Developer B imports it -> "Wow, Tmax has great snippets"
    |       |       |
    |       |       +-- Developer B tells Developer C -> installs Tmax
    |       |
    |       +-- Developer D sees it -> "What app is this?" -> installs Tmax
    |
    +-- Posts on GitHub as gist -> indexed by Google
            |
            +-- Developer E finds it via search -> "Tmax? Let me try"
```

### Snippet Viral Loop Implementation

1. **MVP2**: Export/Import snippet as JSON file (manual sharing)
2. **Post-MVP2**: Snippet pack URL (one-click import from link)
3. **Post-Pro**: Community snippet repository (browse, rate, install)
4. **Long-term**: Snippet marketplace (free + paid packs, revenue share)

---

## 11. Go-to-Market Feature Hierarchy

```
TIER 1: LEAD WITH THESE (Make people stop scrolling)
+-- "50MB vs 200MB+" — Visual benchmark war
+-- "AI finishes your SSH commands" — Novel, screenshot-worthy
+-- "$4/mo and we can't even read your passwords" — Price + privacy combo

TIER 2: DEEPEN INTEREST (Make people click through)
+-- Zero-knowledge E2E sync architecture
+-- SSH tunneling made visual (not CLI)
+-- Asciinema recording built-in
+-- Open source MIT — self-host if you want

TIER 3: RETAIN (Make people stay)
+-- Snippet manager with fuzzy search
+-- Workspace presets
+-- Command history analytics
+-- Android app (same vault, same experience)
```

### "I Need This NOW" Features by Segment

| Segment | The "NOW" Feature | Trigger |
|---------|-------------------|---------|
| DevOps with old laptop | 50MB RAM benchmark | Activity Monitor screenshot showing Termius eating 350MB |
| Security engineer | Zero-knowledge sync + open source crypto | News of another credential breach |
| Team lead | Session recording for audit | Compliance audit coming up |
| Freelancer | Snippet packs + $4/mo vs $10/mo Termius | Budget review |
| Vim/tmux power user | TUI support + keyboard-first workflow | "Finally, an SSH client that doesn't break htop" |

---

## 12. Blocking Issues yang Harus Diresolve SEBELUM Sprint 1

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | **Duplicate xterm dependency** — `package.json` has both `xterm: ^5.3.0` AND `@xterm/xterm: ^6.0.0` | Type conflicts, runtime issues | Remove `xterm` v5, keep only `@xterm/xterm` v6 |
| 2 | **No real keepalive** — `ssh.rs` only checks if handle is closed, doesn't send keepalive packets | Long-running tunnels will timeout | Implement proper `SSH_MSG_IGNORE` keepalive |
| 3 | **No tunnel support in SshCommand enum** | Cannot add tunneling feature | Add `SshCommand::Tunnel` variant + refactor select! loop |
| 4 | **SFTP channel-per-operation pattern** | Won't work for persistent tunnels | Refactor to channel factory/pool |

---

*Dibuat oleh 3 subagent: Marketing Strategist, Product Manager, Lead Engineer*
*Tanggal: 2026-05-29*
*Status: Draft — Ready for team discussion*
