# Rencana Implementasi Termiaxial (Tmax)

## 0. Arsitektur Sistem

```
┌─────────────────────────────────────────────┐
│                  Frontend (React)            │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Xterm.js │ │ FileTree │ │ Vault UI     │ │
│  │ Terminal  │ │ SFTP     │ │ HostManager  │ │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       │ Zustand Store (state mgmt)  │         │
│       └──────────┬──────────────────┘         │
│              Tauri IPC (invoke + events)       │
├───────────────────────────────────────────────┤
│                 Backend (Rust/Tauri v2)        │
│  ┌──────────┐ ┌───────┐ ┌──────────────────┐ │
│  │ russh    │ │ SFTP  │ │ Vault (SQLite +  │ │
│  │ SSH Core │ │ Subsys│ │ AES-GCM/Argon2) │ │
│  └──────────┘ └───────┘ └──────────────────┘ │
│  ┌──────────┐ ┌───────────┐ ┌──────────────┐ │
│  │ AI LLM   │ │ Webhook   │ │ BG Service   │ │
│  │ Client   │ │ Notifier  │ │ (Android)    │ │
│  └──────────┘ └───────────┘ └──────────────┘ │
└───────────────────────────────────────────────┘
```

## 1. Struktur Proyek

```
termiaxial/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── ssh.rs
│   │   │   ├── sftp.rs
│   │   │   ├── vault.rs
│   │   │   ├── ai.rs
│   │   │   └── webhook.rs
│   │   ├── ssh/
│   │   │   ├── mod.rs
│   │   │   ├── client.rs
│   │   │   ├── session.rs
│   │   │   └── keepalive.rs
│   │   ├── vault/
│   │   │   ├── mod.rs
│   │   │   ├── db.rs
│   │   │   ├── crypto.rs
│   │   │   └── migration.rs
│   │   ├── sftp/
│   │   │   ├── mod.rs
│   │   │   └── operations.rs
│   │   ├── ai/
│   │   │   ├── mod.rs
│   │   │   ├── provider.rs
│   │   │   ├── openai.rs
│   │   │   ├── anthropic.rs
│   │   │   └── ollama.rs
│   │   └── models/
│   │       ├── mod.rs
│   │       ├── host.rs
│   │       └── credential.rs
│   └── icons/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── stores/
│   │   ├── vault-store.ts
│   │   ├── terminal-store.ts
│   │   ├── sftp-store.ts
│   │   └── settings-store.ts
│   ├── components/
│   │   ├── terminal/
│   │   │   ├── TerminalView.tsx
│   │   │   └── VirtualKeyboard.tsx
│   │   ├── vault/
│   │   │   ├── HostList.tsx
│   │   │   ├── HostForm.tsx
│   │   │   └── MasterPasswordModal.tsx
│   │   ├── sftp/
│   │   │   ├── FileExplorer.tsx
│   │   │   ├── FileTree.tsx
│   │   │   └── TransferProgress.tsx
│   │   ├── ai/
│   │   │   ├── AIChatModal.tsx
│   │   │   └── LLMSettings.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainPanel.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   ├── hooks/
│   │   ├── use-ssh.ts
│   │   ├── use-sftp.ts
│   │   └── use-terminal.ts
│   ├── lib/
│   │   ├── tauri-ipc.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 2. Fase Implementasi

### Fase 1: Scaffold & Fondasi (Minggu 1)

**Langkah-langkah:**
1. Inisialisasi proyek Tauri v2 dengan template React + TypeScript
2. Konfigurasi `tauri.conf.json`
3. Setup Tailwind CSS + base UI layout
4. Setup Zustand stores
5. Setup SQLite via `rusqlite`
6. Implementasi Argon2id hashing
7. Implementasi AES-GCM-256 encryption/decryption
8. Buat tabel database

## 3. Tech Stack Detail

| Layer | Teknologi | Versi/Notes |
|-------|-----------|-------------|
| Framework | Tauri v2 | @tauri-apps/cli@^2 |
| Frontend | React 18 + TypeScript | Vite bundler |
| Styling | Tailwind CSS v3 | + @headlessui/react |
| State | Zustand v4 | Persist middleware |
| Terminal | xterm.js v5 | + @xterm/addon-fit |
| SSH | russh v0.45 | Pure Rust SSH2 implementation |
| Crypto | ring v0.17 | AES-GCM-256 |
| KDF | argon2 v0.5 | Argon2id |
| Database | rusqlite v0.31 | bundled SQLite |
| HTTP | reqwest v0.12 | Untuk LLM API + Webhook |
| Async | tokio v1 | Multi-thread runtime |

## 4. Urutan Implementasi (Dependency Graph)

```
Fase 1: Scaffold + DB + Crypto
    │
    ├──► Fase 2: Vault (butuh DB + Crypto)
    │       │
    │       └──► Fase 3: SSH (butuh Vault)
    │               │
    │               ├──► Fase 4: Terminal (butuh SSH)
    │               │
    │               └──► Fase 5: SFTP (butuh SSH)
    │                       │
    │                       └──► Fase 6: AI + Webhook (butuh terminal + SSH)
```
