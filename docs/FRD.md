# Functional Requirements Document (FRD)

## 1. Modul Konektivitas Inti (Core Connectivity)

### FR-1.1 SSH Authentication
- **Spesifikasi**: Sistem harus mendukung koneksi SSH menggunakan autentikasi kata sandi dan kunci privat (RSA, ED25519) menggunakan crate `russh`.
- **Detail**: 
  - Parsing kunci privat dari format OpenSSH (PEM)
  - Verifikasi host key (fingerprint SHA-256)
  - Fallback ke autentikasi password jika kunci gagal

### FR-1.2 Keep-Alive Mechanism
- **Spesifikasi**: Sistem harus menangani koneksi keep-alive (ping/pong SSH) untuk mencegah server memutus koneksi karena idle timeout.
- **Detail**:
  - Interval default: 30 detik
  - Kirim SSH_MSG_IGNORE untuk menjaga koneksi aktif
  - Configurable via settings

### FR-1.3 Android Background Service (Post-MVP)
- **Spesifikasi**: Pada platform Android, sistem harus mendaftarkan proses Rust ke Foreground Service dengan notifikasi persisten agar koneksi SSH tetap berjalan di latar belakang tanpa dimatikan paksa.

## 2. Modul Antarmuka Terminal (Terminal Emulator)

### FR-2.1 Xterm.js Integration
- **Spesifikasi**: Frontend React harus mengintegrasikan xterm.js dengan dukungan:
  - Pewarnaan ANSI 256
  - Auto-resize (menyesuaikan ukuran jendela)
  - Scrollback buffer minimal 5000 baris
  - Copy/Paste keyboard shortcuts
  - Zoom in/out

### FR-2.2 Virtual Action Row (Mobile)
- **Spesifikasi**: UI harus memuat komponen Virtual Action Row di atas keyboard bawaan ponsel dengan tombol:
  - Tab, Ctrl, Alt, Esc
  - Arrow Keys (↑↓←→)
- **Detail**: Input tombol diubah menjadi escape sequence sebelum dikirim via Tauri IPC ke Rust

### FR-2.3 Low-Latency IPC
- **Spesifikasi**: Harus terdapat mekanisme IPC dua arah dengan latensi sangat rendah antara React dan Rust.
- **Detail**:
  - Gunakan Tauri v2 Channel API untuk streaming data
  - Transfer data sebagai Uint8Array/ArrayBuffer (bukan base64 string)
  - Batch terminal output setiap 16ms untuk optimalisasi latency

## 3. Modul Vault & Keamanan Kredensial (Security Vault)

### FR-3.1 Local Storage
- **Spesifikasi**: Aplikasi harus menyimpan data daftar Host dan Kredensial secara lokal menggunakan SQLite terintegrasi. Letak database harus dikelola oleh Tauri di direktori data aplikasi yang aman.
- **Detail**:
  - Direktori:
    - Windows: `%APPDATA%\Termiaxial\`
    - macOS: `~/Library/Application Support/Termiaxial/`
    - Linux: `~/.config/termiaxial/`

### FR-3.2 Encryption
- **Spesifikasi**: Kata sandi dan private keys tidak boleh disimpan dalam bentuk plain text. Sistem harus mengenkripsi kolom ini menggunakan algoritma AES-GCM-256 (via crate ring).
- **Detail**:
  - GCM nonce: 12 bytes (random per encrypt)
  - Tag: 16 bytes (untuk verifikasi integrity)

### FR-3.3 Master Password
- **Spesifikasi**: Pengguna diwajibkan menyetel Master Password saat instalasi awal. Master Password ini akan di-hash dengan Argon2id untuk membuat kunci dekripsi (Vault Key) di memori RAM selama aplikasi aktif.
- **Detail**:
  - Argon2id params: m=65536 (64MB), t=3 (3 passes), p=2 (2 threads)
  - Vault Key disimpan di memori (Rust `Box<[u8; 32]>`) dan di-zeroize saat app ditutup

## 4. Modul Manajemen File (SFTP)

### FR-4.1 File Explorer UI
- **Spesifikasi**: Sistem harus menyediakan UI File Explorer (pohon direktori) terpisah dari layar hitam terminal.
- **Detail**:
  - Lazy load tree node
  - Context menu: rename, delete, download, upload
  - Dual-panel view (local vs remote) opsional

### FR-4.2 SFTP Operations
- **Spesifikasi**: Rust backend harus mampu membaca dan menulis file biner melalui subsistem SFTP. Operasi SFTP harus memiliki progress bar yang dipancarkan melalui Tauri Events ke React.
- **Detail**:
  - Chunk size: 64KB
  - Emit progress setiap 1MB transfer
  - Support resume download/upload

## 5. Fitur Cerdas Tambahan (Smart Add-ons) - MVP Akhir

### FR-5.1 AI Assistant
- **Spesifikasi**: Menyediakan kolom input BYOK (Bring Your Own Key) untuk API LLM. Tombol pintas (Ctrl+Space) akan membaca 50 baris terakhir dari layar xterm.js, mengirimkannya ke LLM, dan menampilkan penjelasan/saran perintah dalam bentuk pop-up modal.
- **Detail**:
  - Providers: OpenAI GPT-4/GPT-3.5, Anthropic Claude, Ollama
  - Prompt template:
    ```
    Explain this terminal output and suggest next commands:
    <50 lines of output>
    ```

### FR-5.2 Webhook Notification
- **Spesifikasi**: Pengguna dapat menyimpan endpoint Telegram/WhatsApp webhook dalam setelan aplikasi. Ada tombol UI untuk memicu Rust agar "mendengarkan" hingga script panjang selesai dan mengirim POST request HTTP ke webhook tersebut.
- **Detail**:
  - Webhook format: JSON
  - Payload:
    ```json
    {
      "event": "command_completed",
      "exit_code": 0,
      "host": "192.168.1.100",
      "timestamp": "2024-01-01T12:00:00Z",
      "command": "docker ps"
    }
    ```
