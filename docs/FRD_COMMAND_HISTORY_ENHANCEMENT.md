# Functional Requirements Document — Command History Enhancement

**Tanggal**: 2026-06-05  
**Status**: Draft  
**Versi**: 1.0  
**Scope**: Pengembangan fitur Command History dari passive recording menjadi intelligent command assistance system.

---

## Executive Summary

Fitur Command History saat ini hanya mencatat command yang dieksekusi user. Dokumen ini mendefinisikan pengembangan menjadi sistem yang secara aktif membantu user melalui inline autocomplete, smart suggestions, pattern detection, frecency ranking, dan analytics — menjadikannya competitive advantage utama termiaxial dibanding SSH client lain.

---

## F-CH1: Inline Ghost-Text Autocomplete

**User Flow**: User mengetik di terminal → ghost-text muncul (dimmed) menunjukkan suggestion dari history → user tekan `→` (Right Arrow) untuk accept, atau terus mengetik untuk ignore.

### F-CH1.1 — Real-time Input Monitoring

- **Given** user sedang mengetik command di terminal aktif
- **When** user telah mengetik minimal 2 karakter
- **Then** sistem melakukan fuzzy search di history database untuk session/host yang sama, menampilkan top-1 match sebagai ghost-text di xterm

**Detail teknis**:
- Debounce interval: 100ms setelah keystroke terakhir
- Search scope prioritas: (1) current session → (2) same host → (3) global history
- Ghost-text dirender sebagai xterm decoration (dim color, italic) setelah cursor position
- Ghost-text dihapus jika user mengetik karakter yang tidak match

### F-CH1.2 — Accept / Dismiss Gesture

- **Given** ghost-text suggestion sedang ditampilkan
- **When** user menekan `→` (Right Arrow) atau `End`
- **Then** sisa suggestion dikirim sebagai input ke SSH session (seolah user mengetik)

- **Given** ghost-text suggestion sedang ditampilkan
- **When** user menekan karakter lain, `Esc`, atau `Ctrl+C`
- **Then** ghost-text dihapus dan input dilanjutkan normal

### F-CH1.3 — Partial Accept

- **Given** ghost-text suggestion menunjukkan `docker-compose up -d`
- **When** user menekan `Ctrl+→` (Ctrl+Right)
- **Then** hanya satu kata berikutnya yang di-accept (word-by-word accept)

### F-CH1.4 — Cycle Suggestions

- **Given** ada multiple match untuk input saat ini
- **When** user menekan `Alt+→` atau `Alt+↓`
- **Then** ghost-text berganti ke suggestion berikutnya (cycle through top-5)

---

## F-CH2: Frecency Ranking Engine

**User Flow**: Transparent — user tidak berinteraksi langsung. Ranking mempengaruhi urutan suggestions dan search results.

### F-CH2.1 — Score Calculation

- **Given** sebuah command ada di history database
- **When** sistem menghitung relevance score untuk suggestion/search
- **Then** score dihitung dengan formula:

```
frecency_score = (frequency_weight * usage_count) + (recency_weight * decay_factor)

decay_factor = e^(-0.1 * days_since_last_use)
frequency_weight = 1.0
recency_weight = 2.0
```

**Detail**:
- Command yang dipakai 50x tapi terakhir 30 hari lalu kalah dari command yang dipakai 5x tapi 1 jam lalu
- Score di-recalculate lazily saat query (bukan precomputed)

### F-CH2.2 — Context Multiplier

- **Given** user sedang terkoneksi ke host `prod-web-01`
- **When** sistem menghitung frecency score
- **Then** score mendapat multiplier berdasarkan context:

| Context Match | Multiplier |
|---|---|
| Same session | ×3.0 |
| Same host | ×2.0 |
| Same user@host | ×2.5 |
| Global (different host) | ×1.0 |

### F-CH2.3 — Decay Cleanup

- **Given** database memiliki command dengan `frecency_score < 0.01` dan `last_used > 90 days`
- **When** scheduled cleanup berjalan (setiap app launch)
- **Then** entry tersebut di-archive (soft delete) untuk menjaga performa query

---

## F-CH3: Context-Aware Suggestions

**User Flow**: User memilih server dari vault → connect → suggestion memprioritaskan command yang relevan untuk host/environment tersebut.

### F-CH3.1 — Host-Scoped History

- **Given** command history menyimpan `session_id` yang terkorelasi ke host
- **When** user connect ke host tertentu dan mulai mengetik
- **Then** autocomplete memprioritasikan command yang pernah dijalankan di host yang sama

**Schema tambahan**:
```sql
ALTER TABLE command_history ADD COLUMN host TEXT;
ALTER TABLE command_history ADD COLUMN user_at_host TEXT; -- e.g. "root@prod-web-01"
CREATE INDEX idx_history_host ON command_history(host);
```

### F-CH3.2 — Sequential Pattern Detection

- **Given** user sering menjalankan `cd /var/log` diikuti `tail -f syslog`
- **When** user menjalankan `cd /var/log` dan menekan Enter
- **Then** pada keystroke berikutnya, ghost-text langsung menampilkan `tail -f syslog` (tanpa user mengetik apa pun)

**Detail**:
- Pattern dideteksi dari sequence 2-5 command berurutan
- Minimum occurrence: 3x agar dianggap pattern
- Pattern disimpan di tabel `command_patterns`:

```sql
CREATE TABLE command_patterns (
    id TEXT PRIMARY KEY,
    sequence TEXT NOT NULL,       -- JSON array: ["cmd1", "cmd2", "cmd3"]
    occurrence_count INTEGER DEFAULT 1,
    last_seen TEXT NOT NULL,
    host TEXT,
    confidence REAL DEFAULT 0.0   -- occurrence / total times cmd1 was run
);
```

### F-CH3.3 — Directory-Aware Suggestions (Best Effort)

- **Given** terminal output mengandung prompt yang menunjukkan current directory (e.g. `user@host:/var/log$`)
- **When** sistem mendeteksi perubahan directory dari prompt pattern
- **Then** suggestion memprioritasikan command yang pernah dijalankan di directory tersebut

**Detail**:
- Prompt detection via configurable regex (default: `.*:(.+?)[$#]\s*$`)
- Best effort — tidak semua prompt format bisa diparse
- Fallback ke host-scoped jika directory tidak terdeteksi

---

## F-CH4: Smart Command Chains & Auto-Snippet

**User Flow**: User menjalankan sequence command berulang kali → notification muncul "Detected repeated pattern. Save as snippet?" → user confirm → snippet ter-create otomatis.

### F-CH4.1 — Pattern Detection Engine

- **Given** user telah menjalankan sequence command A→B→C sebanyak ≥3 kali di host yang sama
- **When** user menjalankan command A lagi
- **Then** sistem menampilkan subtle notification: "You usually run B then C after this. Create a snippet?"

**Detection rules**:
- Window: 5 command terakhir
- Minimum repeat: 3x (configurable)
- Sequence length: 2-5 commands
- Ignore single-char commands (`ls`, `cd`, `pwd`) kecuali sebagai bagian dari pattern

### F-CH4.2 — Auto-Snippet Generation

- **Given** user mengkonfirmasi pattern detection notification
- **When** user menekan "Save as Snippet"
- **Then** snippet otomatis ter-create dengan:
  - Name: auto-generated dari command pertama + host (e.g. "Deploy sequence @ prod-web-01")
  - Command: sequence digabung dengan `&&` atau `;` (user pilih separator)
  - Tags: auto-tagged `["auto-generated", hostname]`
  - Variables: jika ada argumen yang berubah antar-eksekusi, otomatis dijadikan `{VAR}`

### F-CH4.3 — Workflow Runner

- **Given** user memiliki snippet multi-command (chain)
- **When** user mengeksekusi snippet tersebut via `Ctrl+K` palette
- **Then** command dijalankan berurutan, dengan:
  - Visual indicator per-step (✓ done, ⏳ running, ○ pending)
  - Stop-on-error option (default: stop if exit_code ≠ 0)
  - Execution log ter-record di history sebagai satu "workflow run"

---

## F-CH5: Command Analytics & Insights

**User Flow**: User membuka History panel → tab "Analytics" → melihat statistik usage.

### F-CH5.1 — Usage Statistics Dashboard

- **Given** user membuka History panel dan navigasi ke tab Analytics
- **When** data di-load
- **Then** tampilkan:

| Metric | Visualisasi |
|---|---|
| Top 10 commands (per host / global) | Horizontal bar chart |
| Commands per day (30 hari terakhir) | Sparkline |
| Most active hours | Heatmap 24-jam |
| Average commands per session | Single metric card |
| Unique hosts accessed | Single metric card |

### F-CH5.2 — Failure Analysis

- **Given** command history menyimpan `exit_code`
- **When** user membuka Analytics → Failures tab
- **Then** tampilkan:
  - Commands yang paling sering gagal (exit_code ≠ 0)
  - Failure rate per host
  - Pattern: command yang selalu gagal di host tertentu tapi berhasil di host lain

**Catatan**: exit_code detection memerlukan parsing prompt output — ini best-effort. Alternatif: user manually mark command sebagai success/fail.

### F-CH5.3 — Export History

- **Given** user ingin backup atau menganalisa history di tool lain
- **When** user klik "Export" di History panel
- **Then** history di-export dalam format:
  - CSV (default): `timestamp, host, command, exit_code`
  - JSON: full entry termasuk session metadata
  - Bash history format: plain list of commands (compatible dengan `~/.bash_history`)

---

## F-CH6: Shared Team History (Cloud-Dependent)

**Prerequisite**: Cloud sync infrastructure (lihat `CLOUD_SYNC_TECH_SPEC.md`)

**User Flow**: Team admin enable shared history untuk workspace → member connect ke shared host → melihat command yang pernah dijalankan oleh teammate di host tersebut.

### F-CH6.1 — Workspace History Sync

- **Given** user adalah member dari workspace dengan shared history enabled
- **When** user menjalankan command di host yang ter-register di workspace
- **Then** command di-sync ke cloud (encrypted at rest) dan visible oleh member lain

**Privacy controls**:
- Per-command opt-out: prefix command dengan space (` command`) → tidak di-sync (mirip bash HISTCONTROL)
- Per-host opt-out: mark host sebagai "private" di settings
- Redaction rules: auto-redact patterns (passwords, tokens) sebelum sync

### F-CH6.2 — Team Suggestions

- **Given** user connect ke shared host dan mulai mengetik
- **When** autocomplete search berjalan
- **Then** suggestion termasuk command dari teammate, ditandai dengan badge:
  - 👤 Your history
  - 👥 Team history (with username attribution)

### F-CH6.3 — Command Annotations

- **Given** user atau teammate menjalankan command penting
- **When** user right-click command di history → "Add Note"
- **Then** annotation tersimpan dan visible oleh semua member
  - Use case: "Jangan jalankan ini saat deploy!" atau "Ini fix untuk bug X"

---

## F-CH7: Safety & Dangerous Command Detection

**User Flow**: User mengetik `rm -rf /` → warning overlay muncul → user harus confirm sebelum command terkirim ke server.

### F-CH7.1 — Dangerous Command Patterns

- **Given** user mengetik atau akan mengeksekusi command dari snippet/autocomplete
- **When** command cocok dengan dangerous pattern
- **Then** tampilkan warning modal dengan:
  - Risk level: 🔴 Critical / 🟡 Warning
  - Explanation: apa yang akan terjadi
  - Confirm button dengan 3-second delay

**Default dangerous patterns** (configurable):
```
CRITICAL:
- rm -rf /
- rm -rf /*
- mkfs.*
- dd if=* of=/dev/sd*
- chmod -R 777 /
- :(){ :|:& };:

WARNING:
- rm -rf (tanpa path tertentu → confirm path)
- DROP DATABASE
- TRUNCATE TABLE
- shutdown
- reboot
- kill -9 1
- iptables -F
```

### F-CH7.2 — Custom Rules per Host

- **Given** user ingin menambahkan dangerous command khusus untuk production server
- **When** user menambahkan rule di Settings → Safety → per-host rules
- **Then** rule hanya aktif saat terkoneksi ke host tersebut

**Schema**:
```sql
CREATE TABLE safety_rules (
    id TEXT PRIMARY KEY,
    host_pattern TEXT,          -- glob: "prod-*" or exact: "prod-web-01"
    command_pattern TEXT NOT NULL, -- regex
    level TEXT NOT NULL,        -- "critical" | "warning"
    message TEXT,
    created_at TEXT NOT NULL
);
```

### F-CH7.3 — Audit Log

- **Given** user mengeksekusi command yang ter-flag dangerous
- **When** user mengkonfirmasi eksekusi
- **Then** event tercatat di audit log:
  - Who (user)
  - What (command)
  - Where (host)
  - When (timestamp)
  - Confirmation method (typed confirm / clicked button)

---

## F-CH8: Intelligent Search & Recall

**User Flow**: User tekan `Ctrl+R` di terminal → overlay search muncul (mirip fzf/reverse-i-search) → ketik query → hasil real-time → Enter untuk execute.

### F-CH8.1 — Reverse Interactive Search

- **Given** user menekan `Ctrl+R` saat di terminal
- **When** overlay search muncul
- **Then**:
  - Input field di atas dengan real-time fuzzy search
  - Results list menampilkan: command, host, timestamp, frequency
  - Highlighting pada matched characters
  - `Enter` → execute command langsung
  - `Tab` → paste ke terminal tanpa execute (untuk editing)
  - `Esc` → dismiss

### F-CH8.2 — Natural Language Search

- **Given** user mengetik di search "bagaimana restart nginx" atau "check disk space"
- **When** search diproses
- **Then** sistem match berdasarkan:
  1. Exact/fuzzy match pada command text
  2. Match pada description (jika command pernah di-annotate)
  3. Match pada tags (jika command juga tersimpan sebagai snippet)

**Implementasi**: Lightweight — keyword extraction + fuzzy match, bukan LLM. Mapping common phrases:
```
"restart" → ["systemctl restart", "service * restart", "kill -HUP"]
"disk" → ["df", "du", "lsblk", "fdisk"]
"network" → ["ip", "ifconfig", "netstat", "ss", "ping", "curl"]
```

### F-CH8.3 — Time-Based Recall

- **Given** user ingat "kemarin saya pernah jalankan sesuatu di prod-web"
- **When** user filter search dengan time range (Today / Yesterday / This Week / Custom)
- **Then** hasil di-filter berdasarkan timestamp + host pattern

---

## F-CH9: Session Recording Integration

**User Flow**: Terhubung otomatis — setiap session yang di-record (asciinema format) otomatis memiliki command marker.

### F-CH9.1 — Command Markers in Recording

- **Given** session recording aktif (via `start_recording`)
- **When** user mengeksekusi command (Enter terdeteksi oleh history hook)
- **Then** recording stream mendapat marker/annotation pada timestamp command execution

**Format marker (asciinema v2 extension)**:
```json
[12.345, "m", {"type": "command", "cmd": "docker ps", "exit_code": 0}]
```

### F-CH9.2 — Jump-to-Command in Playback

- **Given** user membuka recording playback di History panel
- **When** user melihat timeline dengan command markers
- **Then** user bisa klik marker untuk jump langsung ke titik waktu command dieksekusi

---

## Database Schema Evolution

### Current Schema (v5)
```sql
CREATE TABLE command_history (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    command TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    exit_code INTEGER
);
CREATE INDEX idx_history_session ON command_history(session_id);
CREATE INDEX idx_history_timestamp ON command_history(timestamp);
```

### Target Schema (v10)
```sql
CREATE TABLE command_history (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    command TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    exit_code INTEGER,
    host TEXT,
    user_at_host TEXT,
    working_dir TEXT,
    duration_ms INTEGER,
    frecency_score REAL DEFAULT 0.0,
    last_used TEXT,
    usage_count INTEGER DEFAULT 1,
    is_archived INTEGER DEFAULT 0,
    annotation TEXT,
    synced INTEGER DEFAULT 0
);

CREATE TABLE command_patterns (
    id TEXT PRIMARY KEY,
    sequence TEXT NOT NULL,
    occurrence_count INTEGER DEFAULT 1,
    last_seen TEXT NOT NULL,
    host TEXT,
    confidence REAL DEFAULT 0.0
);

CREATE TABLE safety_rules (
    id TEXT PRIMARY KEY,
    host_pattern TEXT,
    command_pattern TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_history_host ON command_history(host);
CREATE INDEX idx_history_user_host ON command_history(user_at_host);
CREATE INDEX idx_history_frecency ON command_history(frecency_score DESC);
CREATE INDEX idx_history_command ON command_history(command);
CREATE INDEX idx_patterns_host ON command_patterns(host);
```

### Migration Path
```
v6: ADD COLUMN host, user_at_host, CREATE INDEX idx_history_host
v7: ADD COLUMN frecency_score, usage_count, last_used
v8: ADD COLUMN working_dir, duration_ms, is_archived
v9: CREATE TABLE command_patterns
v10: CREATE TABLE safety_rules, ADD COLUMN annotation, synced
```

---

## Implementation Priority (RICE Score)

| Feature | Reach | Impact | Confidence | Effort (weeks) | RICE |
|---|---|---|---|---|---|
| F-CH1 Inline Autocomplete | 95% | 3 (High) | 90% | 1.5 | **171** |
| F-CH2 Frecency Ranking | 95% | 2 (Medium) | 95% | 0.5 | **361** |
| F-CH8 Reverse Search (Ctrl+R) | 80% | 3 (High) | 90% | 1 | **216** |
| F-CH7 Dangerous Command Detection | 70% | 3 (High) | 85% | 1 | **179** |
| F-CH3 Context-Aware Suggestions | 60% | 2 (Medium) | 70% | 2 | **42** |
| F-CH4 Smart Chains & Auto-Snippet | 40% | 2 (Medium) | 60% | 2.5 | **19** |
| F-CH5 Analytics Dashboard | 50% | 1 (Low) | 80% | 1.5 | **27** |
| F-CH9 Recording Integration | 30% | 2 (Medium) | 70% | 1 | **42** |
| F-CH6 Shared Team History | 20% | 3 (High) | 50% | 4 | **8** |

**Recommended Sprint Order**:
1. Sprint 1 (1 week): F-CH2 (Frecency) + F-CH1 (Inline Autocomplete) — foundation + highest UX impact
2. Sprint 2 (1 week): F-CH8 (Reverse Search) + F-CH7 (Dangerous Detection)  
3. Sprint 3 (2 weeks): F-CH3 (Context-Aware) + F-CH4 (Smart Chains)
4. Sprint 4 (1.5 weeks): F-CH5 (Analytics) + F-CH9 (Recording)
5. Post-cloud: F-CH6 (Team History)

---

## Technical Constraints & Considerations

### Performance
- Autocomplete query harus < 10ms (target: 5ms). SQLite FTS5 dipertimbangkan jika history > 50K entries
- Ghost-text rendering tidak boleh menyebabkan jank di xterm (gunakan `requestAnimationFrame`)
- Pattern detection berjalan async (tidak memblokir keystroke)

### xterm.js Limitations
- Ghost-text **bukan** native feature xterm.js. Implementasi via:
  - Option A: xterm Decoration API (`registerDecoration`) — preferred
  - Option B: Overlay div positioned absolutely setelah cursor
  - Option C: Write dimmed text + immediately erase on next keystroke (hacky, last resort)

### Data Privacy
- Command history tersimpan lokal (encrypted via vault key)
- Cloud sync (F-CH6) hanya jika user explicitly enable
- Sensitive patterns (passwords, tokens, API keys) harus auto-redacted sebelum display di analytics/shared

### Mobile Considerations
- Inline ghost-text sulit diimplementasi di mobile keyboard
- Mobile alternative: suggestion chips di atas keyboard (mirip autocomplete di browser address bar)
- Ctrl+R diganti dengan swipe-down gesture atau dedicated button di Action Row

---

## Success Metrics

| Metric | Baseline (current) | Target (post-implementation) |
|---|---|---|
| Commands typed manually (per session) | 100% | -30% (autocomplete reduces typing) |
| Time to find previous command | Manual scroll / no search | < 3 seconds via Ctrl+R |
| Dangerous command incidents | Undetected | 0 (100% caught before execute) |
| Snippet creation rate | Manual only | +50% from auto-detection |
| User retention (7-day) | TBD | +15% (stickiness from personalized suggestions) |

---

## Dependencies

| Dependency | Status | Required By |
|---|---|---|
| Command History recording (use-command-history hook) | ✅ Just integrated | F-CH1, F-CH2, F-CH3 |
| SQLite migration system | ✅ Implemented (v5) | F-CH2, F-CH3, F-CH7 |
| Snippet CRUD | ✅ Just fixed | F-CH4 |
| Session recording | ✅ Backend implemented | F-CH9 |
| Cloud sync infrastructure | 🔲 Not started | F-CH6 |
| xterm Decoration API familiarity | 🔲 Needs spike | F-CH1 |

---

## Open Questions

1. **Ghost-text rendering approach**: Decoration API vs overlay div? Needs prototype spike.
2. **Exit code detection**: Reliable hanya jika prompt diparse. Apakah kita juga mau intercept `echo $?` secara periodik? (Invasif tapi akurat)
3. **Pattern min occurrence**: 3x default — apakah perlu configurable per-user?
4. **Dangerous command list**: Ship dengan defaults + allow community contributions via GitHub?
5. **Mobile ghost-text**: Apakah chip-based suggestion cukup, atau perlu approach lain?
