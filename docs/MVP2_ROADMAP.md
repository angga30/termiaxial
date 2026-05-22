# Termiaxial (Tmax) — MVP2 Roadmap

**Target**: Post-MVP1 feature expansion  
**Fokus**: Power user features — tunneling, snippets, TUI support, dan AI-powered autocomplete

---

## Overview MVP2

MVP1 membangun fondasi: SSH terminal, SFTP, vault, dan AI assistant dasar.  
MVP2 mengubah Tmax dari *SSH client* menjadi **developer productivity platform** — dengan fitur yang biasanya hanya ada di tool berbayar seperti Termius Pro atau Royal TSX.

---

## Feature 1: TUI Research & Support

### Latar Belakang
Banyak tool server-side berjalan sebagai TUI (Text User Interface): `htop`, `vim`, `tmux`, `ranger`, `lazydocker`, `k9s`. Ini membutuhkan dukungan terminal yang lebih dalam dari sekadar ANSI color.

### Research Requirements
- [ ] **Xterm.js capability audit** — pastikan semua escape sequences TUI (mouse events, alternate screen buffer, bracketed paste) sudah aktif
- [ ] **Mouse passthrough** — klik dan scroll di dalam TUI app harus diteruskan ke server
- [ ] **Alternate screen buffer** — `vim`/`htop` harus bisa masuk/keluar alternate screen tanpa artefak
- [ ] **True color (24-bit)** — validasi rendering `$TERM=xterm-256color` vs `xterm-truecolor`
- [ ] **Unicode & emoji rendering** — pastikan karakter wide (CJK, emoji) tidak merusak layout
- [ ] **Resize handling di TUI** — SIGWINCH harus propagate dengan benar ke proses TUI

### Deliverable
Dokumen kompatibilitas TUI + fix yang diperlukan di `TerminalView.tsx` dan PTY config di Rust.

---

## Feature 2: SSH Tunneling

### Deskripsi
Port forwarding via SSH — fitur kritis untuk developer yang akses database, internal service, atau Kubernetes cluster di balik firewall.

### Sub-features

#### 2.1 Local Port Forwarding (`-L`)
```
localhost:PORT → remote_host:PORT (via SSH server)
```
Use case: akses database PostgreSQL di server production dari localhost.

#### 2.2 Remote Port Forwarding (`-R`)
```
remote:PORT → localhost:PORT (via SSH server)
```
Use case: expose local dev server ke internet via VPS.

#### 2.3 Dynamic SOCKS5 Proxy (`-D`)
```
localhost:PORT → SOCKS5 proxy via SSH server
```
Use case: route browser traffic melalui server.

### Implementation Plan

**Backend (Rust)**
- Tambah `tunnel.rs` di `src/commands/`
- Gunakan `russh` channel direct-tcpip untuk local forwarding
- Gunakan `russh` channel tcpip-forward untuk remote forwarding
- Tokio TCP listener untuk SOCKS5 proxy

**Frontend**
- UI panel "Tunnels" di sidebar
- Form: type (Local/Remote/Dynamic), local port, remote host, remote port
- Status indicator per tunnel (active/inactive)
- Persist tunnel config per credential di vault

**Tauri Commands**
```rust
create_tunnel(session_id, tunnel_config) -> tunnel_id
list_tunnels(session_id) -> Vec<TunnelInfo>
close_tunnel(tunnel_id)
```

### Acceptance Criteria
- [ ] Local forwarding bisa digunakan untuk koneksi database (test dengan psql/mysql)
- [ ] Tunnel otomatis reconnect jika SSH session reconnect
- [ ] UI menampilkan bytes transferred per tunnel

---

## Feature 3: Snippet Manager

### Deskripsi
Library perintah yang sering dipakai — bisa di-trigger dengan shortcut atau search, langsung paste ke terminal aktif.

### Sub-features

#### 3.1 Snippet CRUD
- Tambah/edit/hapus snippet
- Field: nama, command, deskripsi, tags, scope (global / per-host)

#### 3.2 Quick Launch
- Shortcut `Ctrl+K` membuka command palette
- Fuzzy search by nama atau isi command
- Enter langsung kirim ke terminal aktif (atau copy ke clipboard)

#### 3.3 Variable Interpolation
```bash
ssh deploy@{HOST} -p {PORT}
```
Saat dijalankan, Tmax prompt input untuk mengisi `{HOST}` dan `{PORT}`.

#### 3.4 Snippet Sharing (Post-MVP2)
- Export/import snippet pack sebagai JSON

### Implementation Plan

**Backend (Rust)**
- Tabel baru di SQLite: `snippets (id, name, command, description, tags, host_id, created_at)`
- Commands: `snippet_add`, `snippet_list`, `snippet_delete`, `snippet_search`

**Frontend**
- `SnippetPalette.tsx` — modal command palette dengan fuzzy search
- `SnippetManager.tsx` — halaman manajemen di settings
- Zustand `snippet-store.ts`
- Keyboard shortcut handler di `TerminalView.tsx`

### Acceptance Criteria
- [ ] Fuzzy search snippet < 50ms response
- [ ] Variable interpolation prompt muncul sebelum command dikirim
- [ ] Snippet tersimpan per-host atau global

---

## Feature 4: Session Recording & AI Autocomplete

### 4.1 Session Recording

#### Deskripsi
Rekam seluruh sesi terminal sebagai file yang bisa di-replay — berguna untuk audit, dokumentasi, atau debugging.

#### Format
Gunakan **asciinema v2 format** (JSON lines) — compatible dengan asciinema player dan bisa di-share.

```json
{"version": 2, "width": 220, "height": 50, "timestamp": 1716000000}
[0.0, "o", "$ "]
[1.2, "o", "docker ps\r\n"]
[1.5, "o", "CONTAINER ID   IMAGE..."]
```

#### Implementation Plan
**Backend (Rust)**
- `recording.rs` — buffer output stream ke file `.cast`
- Commands: `start_recording(session_id, output_path)`, `stop_recording(session_id)`

**Frontend**
- Tombol record di topbar terminal (merah saat aktif)
- Indicator REC di status bar
- File picker untuk pilih lokasi simpan

#### Acceptance Criteria
- [ ] File `.cast` valid dan bisa di-play di asciinema.org
- [ ] Recording tidak menambah latency terminal > 5ms

---

### 4.2 AI-Powered Autocomplete

#### Deskripsi
Saat user mengetik di terminal, AI menyarankan command completion berdasarkan:
1. **History** sesi saat ini
2. **Context** — output 20 baris terakhir
3. **Snippet library** — match dari snippet yang tersimpan

#### Modes

**Mode A: Inline Ghost Text** (seperti GitHub Copilot)
```
$ docker run --rm -it ubuntu[ghost: bash]
```
Tekan `Tab` untuk accept suggestion.

**Mode B: Dropdown Suggestions** (seperti fish shell)
Muncul di bawah prompt, pilih dengan arrow keys.

#### AI Integration
- Provider sama dengan AI Assistant (OpenAI, Ollama, Anthropic)
- Prompt template khusus untuk command completion (bukan explanation)
- **Debounce 500ms** setelah user berhenti mengetik sebelum request ke LLM
- Cache suggestion untuk input yang sama

#### Local-first Fallback
Jika tidak ada API key atau offline:
- Match dari snippet library
- Match dari command history lokal
- Basic bash/zsh completion hints

#### Implementation Plan
**Backend (Rust)**
- `autocomplete.rs` — endpoint `get_completion(context, partial_command) -> Vec<String>`
- Command history store di SQLite: `command_history (session_id, command, timestamp, exit_code)`

**Frontend**
- `useAutocomplete` hook di `TerminalView.tsx`
- Ghost text overlay di atas xterm.js canvas
- Settings toggle: enable/disable, mode (inline/dropdown), debounce delay

#### Acceptance Criteria
- [ ] Suggestion muncul dalam < 800ms setelah user berhenti mengetik
- [ ] Ghost text tidak mengganggu input normal
- [ ] Bisa di-disable per-session atau global dari settings
- [ ] History tersimpan dan digunakan sebagai context

---

## MVP2 Dependency Graph

```
MVP1 (SSH + Terminal + Vault + SFTP + AI Basic)
    │
    ├──► Feature 1: TUI Research (no new backend, fix existing)
    │
    ├──► Feature 2: Tunneling
    │       └── Requires: SSH session (MVP1 ✅)
    │
    ├──► Feature 3: Snippets
    │       └── Requires: SQLite vault (MVP1 ✅), Terminal IPC (MVP1 ✅)
    │
    └──► Feature 4: Recording + AI Autocomplete
            └── Requires: Terminal stream (MVP1 ✅), AI provider (MVP1 ✅)
```

---

## Prioritas & Estimasi

| Feature | Prioritas | Effort | Value |
|---------|-----------|--------|-------|
| TUI Research & Fix | 🔴 High | 1-2 hari | Fondasi semua TUI tools |
| SSH Tunneling | 🔴 High | 4-6 hari | Killer feature vs kompetitor |
| Snippet Manager | 🟠 Medium | 3-4 hari | Daily productivity |
| Session Recording | 🟡 Medium | 2-3 hari | Audit & dokumentasi |
| AI Autocomplete | 🟡 Medium | 4-5 hari | Diferensiasi AI-native |

**Total Estimasi MVP2**: 14-20 hari development

---

## Tech Additions untuk MVP2

| Kebutuhan | Library | Alasan |
|-----------|---------|--------|
| SOCKS5 proxy | `tokio` + manual impl | Lightweight, no extra dep |
| Fuzzy search | `nucleo` (Rust) | Dipakai Helix editor, sangat cepat |
| Asciinema format | Custom serializer | Format sederhana, tidak perlu crate |
| Command history | SQLite (existing) | Reuse infrastruktur vault |

---

## Post-MVP2 (Preview)

- **Multi-hop SSH** (jump host / bastion)
- **Android app** dengan Virtual Action Row
- **Team vault sync** (encrypted, self-hosted)
- **Plugin system** (Rust WASM plugins)
