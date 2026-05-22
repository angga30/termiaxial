# Tmax Cloud Sync — Technical Specification

**Versi**: 0.1 (Draft)  
**Fitur**: Multiple Device Sync via Tmax Cloud  
**Model**: Zero-Knowledge SaaS

---

## 1. Prinsip Desain

### Zero-Knowledge Architecture
Server **tidak pernah** melihat plaintext data vault. Enkripsi dan dekripsi terjadi **100% di sisi client** (device). Server hanya menyimpan dan mendistribusikan ciphertext.

```
┌─────────────────────────────────────────────────────────┐
│  Yang server TAHU:  user_id, device_id, timestamp, size │
│  Yang server TIDAK TAHU: credentials, keys, hostnames   │
└─────────────────────────────────────────────────────────┘
```

### Conflict Resolution
Gunakan **Last-Write-Wins (LWW)** dengan vector clock per record — cukup untuk use case vault sync yang tidak butuh collaborative editing.

---

## 2. Arsitektur Sistem

```
┌──────────────┐     HTTPS/WSS      ┌─────────────────────┐
│  Tmax Client │ ◄─────────────────► │  Tmax Sync API      │
│  (Desktop)   │                     │  (Rust/Axum)        │
└──────────────┘                     └──────────┬──────────┘
                                                 │
┌──────────────┐     HTTPS/WSS                  │
│  Tmax Client │ ◄───────────────────────────────┤
│  (Android)   │                     ┌──────────▼──────────┐
└──────────────┘                     │  PostgreSQL          │
                                     │  (encrypted blobs)   │
                                     └─────────────────────┘
```

### Komponen

| Komponen | Teknologi | Fungsi |
|----------|-----------|--------|
| Sync API | Rust + Axum | REST + WebSocket endpoint |
| Auth | JWT + refresh token | Session management |
| Database | PostgreSQL | Simpan encrypted vault blobs |
| Cache | Redis | Rate limiting, session cache |
| Object Storage | S3/R2 | Attachment & large blobs |
| CDN/Proxy | Cloudflare | DDoS protection, edge caching |

---

## 3. Data Model

### Client-side (sebelum enkripsi)

```rust
// Vault record yang akan di-sync
struct SyncRecord {
    id: Uuid,
    record_type: RecordType,  // Credential | Snippet | Setting | Tunnel
    payload: Vec<u8>,         // JSON serialized data
    updated_at: DateTime<Utc>,
    device_id: Uuid,
    version: u64,             // Vector clock
    deleted: bool,            // Soft delete
}

enum RecordType {
    Credential,
    Snippet,
    TunnelConfig,
    AppSetting,
}
```

### Server-side (setelah enkripsi, yang disimpan di DB)

```sql
CREATE TABLE sync_records (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id),
    device_id   UUID NOT NULL,
    record_type VARCHAR(32) NOT NULL,
    ciphertext  BYTEA NOT NULL,       -- AES-GCM-256 encrypted payload
    nonce       BYTEA NOT NULL,       -- 12 bytes
    tag         BYTEA NOT NULL,       -- 16 bytes GCM auth tag
    version     BIGINT NOT NULL,      -- vector clock
    updated_at  TIMESTAMPTZ NOT NULL,
    deleted     BOOLEAN DEFAULT FALSE,
    INDEX (user_id, updated_at),
    INDEX (user_id, record_type)
);

CREATE TABLE users (
    id              UUID PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,  -- Argon2id
    sync_key_salt   BYTEA NOT NULL,         -- untuk derive sync key
    created_at      TIMESTAMPTZ NOT NULL,
    plan            VARCHAR(32) DEFAULT 'free'
);

CREATE TABLE devices (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id),
    name        VARCHAR(255),
    platform    VARCHAR(32),   -- macos | windows | linux | android
    last_seen   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL
);
```

---

## 4. Enkripsi End-to-End

### Key Hierarchy

```
Master Password (user input)
        │
        ▼ Argon2id (m=65536, t=3, p=2)
   Vault Key (32 bytes)          ← decrypt local vault
        │
        ▼ HKDF-SHA256 (info="sync-key")
   Sync Key (32 bytes)           ← encrypt data sebelum kirim ke server
        │
        ▼ AES-GCM-256 (nonce random per record)
   Ciphertext                    ← yang disimpan di server
```

**Penting**: Sync Key di-derive dari Vault Key, bukan dari password langsung. Artinya server tidak bisa brute-force password dari data yang tersimpan.

### Proses Enkripsi Record

```rust
fn encrypt_for_sync(record: &SyncRecord, sync_key: &[u8; 32]) -> EncryptedRecord {
    let nonce = random_bytes::<12>();
    let plaintext = serde_json::to_vec(record).unwrap();
    
    // AES-GCM-256
    let ciphertext = aes_gcm_encrypt(&plaintext, sync_key, &nonce);
    
    EncryptedRecord {
        id: record.id,
        record_type: record.record_type.to_string(),
        ciphertext,
        nonce,
        version: record.version,
        updated_at: record.updated_at,
        deleted: record.deleted,
    }
}
```

---

## 5. Sync Protocol

### 5.1 Initial Sync (Full Pull)

```
Client                          Server
  │                               │
  ├─── GET /sync/records ────────►│
  │    (Authorization: Bearer JWT)│
  │                               │
  │◄── 200 { records: [...] } ───┤
  │    (semua ciphertext milik    │
  │     user ini)                 │
  │                               │
  ├─── decrypt semua records ─────┤ (local, no server)
  │                               │
  ├─── merge ke local SQLite ─────┤ (LWW by version)
```

### 5.2 Incremental Sync (Delta Push/Pull)

```
Client                          Server
  │                               │
  │  [user edit credential]       │
  │                               │
  ├─── POST /sync/push ──────────►│
  │    { records: [encrypted] }   │
  │                               │
  │◄── 200 { conflicts: [] } ────┤
  │                               │
  │  [background pull setiap 30s] │
  ├─── GET /sync/records?since=T ►│
  │                               │
  │◄── 200 { records: [delta] } ─┤
  │                               │
  ├─── decrypt & merge ───────────┤
```

### 5.3 Real-time Push via WebSocket

```
Client                          Server
  │                               │
  ├─── WS /sync/live ────────────►│
  │    (upgrade connection)       │
  │                               │
  │  [Device B edit credential]   │
  │                               │
  │◄── WS { event: "record_updated", id: "..." } ─┤
  │                               │
  ├─── GET /sync/records/:id ────►│
  │◄── 200 { ciphertext: "..." } ─┤
  │                               │
  ├─── decrypt & apply ───────────┤
```

### 5.4 Conflict Resolution (LWW)

```rust
fn merge_records(local: &SyncRecord, remote: &SyncRecord) -> SyncRecord {
    // Last Write Wins berdasarkan version (vector clock)
    if remote.version > local.version {
        remote.clone()  // remote menang
    } else {
        local.clone()   // local menang
    }
}
```

---

## 6. API Endpoints

### Auth

```
POST   /auth/register          Daftar akun baru
POST   /auth/login             Login, dapat JWT + refresh token
POST   /auth/refresh           Refresh JWT
POST   /auth/logout            Revoke refresh token
DELETE /auth/account           Hapus akun + semua data
```

### Sync

```
GET    /sync/records           Pull semua records (initial sync)
GET    /sync/records?since=T   Pull delta sejak timestamp T
GET    /sync/records/:id       Pull satu record
POST   /sync/push              Push batch records (max 100 per request)
DELETE /sync/records/:id       Soft delete record
```

### Devices

```
GET    /devices                List semua device terdaftar
POST   /devices                Register device baru
DELETE /devices/:id            Revoke device (remote logout)
```

### Account

```
GET    /account/usage          Storage usage, device count
GET    /account/plan           Info plan (free/pro)
```

---

## 7. Authentication Flow

### Register & First Sync Setup

```
1. User input email + password di Tmax app
2. Client: derive Vault Key dari password (Argon2id)
3. Client: derive Sync Key dari Vault Key (HKDF)
4. Client: POST /auth/register { email, password_hash, sync_key_salt }
   - password_hash = Argon2id(password) — untuk auth ke server
   - sync_key_salt = random salt untuk HKDF (server simpan, tidak sensitif)
5. Server: simpan user, return JWT
6. Client: mulai encrypt & push vault records
```

### Login di Device Baru

```
1. User input email + password
2. Client: POST /auth/login { email, password }
3. Server: verifikasi password_hash, return JWT + sync_key_salt
4. Client: derive Vault Key → Sync Key menggunakan sync_key_salt
5. Client: GET /sync/records (pull semua data)
6. Client: decrypt semua records dengan Sync Key
7. Client: populate local SQLite vault
```

---

## 8. Rate Limiting & Quotas

### Free Plan
| Limit | Value |
|-------|-------|
| Devices | 2 |
| Records | 500 |
| Sync frequency | 5 menit |
| Storage | 5 MB |

### Pro Plan (~$4/bulan)
| Limit | Value |
|-------|-------|
| Devices | Unlimited |
| Records | Unlimited |
| Sync frequency | Real-time (WebSocket) |
| Storage | 100 MB |

---

## 9. Privacy & Security Guarantees

| Jaminan | Implementasi |
|---------|-------------|
| Server tidak bisa baca vault | AES-GCM-256 client-side, key tidak pernah dikirim |
| Password tidak disimpan plaintext | Argon2id hash di server |
| Sync Key tidak bisa di-reverse | HKDF one-way derivation |
| Data terhapus benar-benar hilang | Hard delete setelah 30 hari soft delete |
| Transport security | TLS 1.3 minimum |
| Token expiry | JWT 15 menit, refresh token 30 hari |

---

## 10. Infrastructure Stack

```
Cloudflare (DNS + DDoS)
        │
        ▼
   Load Balancer
        │
   ┌────┴────┐
   │  API    │  Rust + Axum (stateless, horizontal scale)
   │ Server  │
   └────┬────┘
        │
   ┌────┴──────────┐
   │  PostgreSQL   │  Primary + Read Replica
   │  (RDS/Supabase│
   └───────────────┘
        │
   ┌────┴──────────┐
   │  Redis        │  Rate limiting, session cache
   └───────────────┘
```

### Deployment Options (awal)
- **Supabase** — PostgreSQL managed + Auth built-in, cocok untuk bootstrap cepat
- **Railway / Fly.io** — deploy Rust API container, murah untuk early stage
- **Cloudflare R2** — object storage untuk large blobs, free egress

---

## 11. Client Integration (Tmax App)

### Rust Backend Changes

```rust
// Tambah di Cargo.toml
reqwest = { version = "0.12", features = ["json"] }

// New commands
sync_login(email, password) -> Result<AuthToken>
sync_push(records: Vec<EncryptedRecord>) -> Result<()>
sync_pull(since: Option<DateTime>) -> Result<Vec<EncryptedRecord>>
sync_status() -> SyncStatus  // last_sync, pending_count, connected
```

### Frontend Changes

```typescript
// settings-store.ts — tambah sync settings
interface SyncSettings {
  enabled: boolean
  email: string
  lastSync: string | null
  deviceName: string
  plan: 'free' | 'pro'
}

// Sync indicator di Topbar
// Settings page: Login/Logout, device list, sync status
```

---

## 12. Estimasi Effort

| Task | Effort |
|------|--------|
| Backend API (Rust/Axum) | 6-8 hari |
| Database schema + migrations | 1 hari |
| Client sync engine (Rust) | 3-4 hari |
| Frontend sync UI | 2-3 hari |
| Auth flow (register/login/device) | 2 hari |
| Testing & security audit | 3 hari |
| **Total** | **17-21 hari** |
