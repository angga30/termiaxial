# Product Requirements Document (PRD)

## 1. Ikhtisar Produk (Product Overview)

### Nama Proyek
**Termiaxial (Tmax)** - SSH/SFTP Client ultra-ringan berbasis Rust dan Tauri v2

### Tujuan
Membangun klien SSH, SFTP, dan manajemen server lintas platform (Windows, macOS, Linux, dan Android) yang **ultra-ringan, cepat, dan aman**. Aplikasi ini bertujuan mengatasi kelemahan aplikasi berbasis Electron (seperti Termius) yang memakan banyak memori RAM dan memiliki startup time yang lambat.

### Elevator Pitch
"Sebuah client SSH yang mirip Termius tapi berjalan di 1/10 resource Electron - ideal untuk developer yang butuh koneksi cepat ke server dari perangkat apapun."

### Target Pengguna
- **Software Engineer** - untuk deployment dan debugging server
- **System Administrator** - manajemen server dan infrastruktur
- **Peneliti OSINT** - koneksi ke berbagai endpoint dengan keamanan tinggi
- **Pengguna command line tingkat lanjut** - yang membutuhkan efisiensi dan kecepatan

## 2. Objektif dan Metrik Keberhasilan (Goals & Metrics)

### Performa (Core Metrics)
- **Idle RAM Usage**: Di bawah 50MB di Desktop (Windows/macOS)
- **Startup Time**: Di bawah 1.5 detik
- **Terminal Latency**: <50ms dari keyboard ke output
- **File Transfer Speed**: Mendekati kecepatan native SSH (via OpenSSH)

### Fungsionalitas Lintas Platform
- **Desktop**: Windows 10+, macOS 10.15+, Linux (X11/Wayland)
- **Android**: Android 10+ (Post-MVP)
- **Satu Codebase**: Menggunakan Tauri v2 untuk multi-target compilation

### Adopsi Pengguna
- Alur migrasi mulus: Import dari `~/.ssh/config`, Termius, Putty
- Export vault ke file terenkripsi untuk backup
- Dukungan import/export JSON format

## 3. Asumsi, Ketergantungan, & Batasan (Assumptions & Constraints)

### Teknologi Utama
- **Frontend**: React.js, Tailwind CSS, Xterm.js
- **Backend**: Tauri v2, Rust
- **SSH Library**: russh crate (pure Rust, tanpa dependensi OpenSSL)
- **Database**: SQLite (rusqlite)
- **Encryption**: ring crate (AES-GCM-256), argon2 crate

### Ketergantungan
- **Mobile Background Service**: Memerlukan plugin pihak ketiga (atau implementasi internal) seperti `tauri-plugin-background-service` agar koneksi SSH tetap berjalan di latar belakang pada Android.
- **LLM API Keys**: User harus memasang API key mereka sendiri (OpenAI/Anthropic) atau menjalankan Ollama lokal.

### Batasan (Out of Scope - MVP)
- **Cloud Sync**: Sinkronisasi otomatis antara perangkat akan ditunda ke tahap post-MVP. Fokus pada enkripsi offline dan ekspor/impor manual.
- **Collaboration**: Fitur sharing koneksi dengan tim ditunda.
- **Plugins**: Ekstensi sistem dengan plugin Rust ditunda.
- **Telnet**: Dukungan Telnet tidak termasuk dalam MVP.

## 4. Kasus Penggunaan Utama (User Personas & Use Cases)

### Persona 1: Angga - Full-Stack Developer
- **Latar belakang**: Bekerja di startup, sering harus monitoring server API dari luar kantor
- **Pain Points**: Termius memakan 200MB+ RAM di laptopnya yang sudah berumur 3 tahun
- **Goal**: Ingin aplikasi SSH ringkas yang bisa dia pakai dari smartphone untuk mengecek log server

#### Use Case: Quick Server Check from Smartphone
1. Membuka aplikasi Tmax di Android
2. Memilih koneksi "Production API" dari Vault terenkripsi
3. Masuk ke terminal layar penuh dengan dukungan keyboard virtual (Ctrl, Esc)
4. Mengeksekusi perintah `docker ps` dan melihat log container
5. Menjalankan `curl http://localhost:3000/health` untuk cek status API

#### Acceptance Criteria
- Waktu login ke Vault: <2 detik
- Waktu koneksi ke server: <3 detik
- Responsif terhadap input keyboard virtual

### Persona 2: Budi - System Administrator
- **Latar belakang**: Manajemen 50+ server untuk perusahaan retail
- **Pain Points**: Butuh mengirim file konfigurasi ke beberapa server sekaligus
- **Goal**: Ingin tool yang bisa upload file dengan progress bar dan notification ketika selesai

#### Use Case: Batch File Upload
1. Membuka aplikasi Tmax di macOS
2. Memilih server grup "Production Web" dari Vault
3. Buka File Explorer SFTP dan navigasi ke direktori `/etc/nginx`
4. Drag-and-drop file `nginx.conf` dari local ke remote
5. Menerima notification webhook di Telegram ketika upload selesai ke semua server

#### Acceptance Criteria
- Progress bar akurat per file
- Bisa melihat status upload untuk setiap server
- Webhook notification terkirim dalam 1 detik setelah selesai

### Persona 3: Cici - Security Researcher
- **Latar belakang**: Melakukan OSINT dan pentesting pada target
- **Pain Points**: Terminus sering terdeteksi oleh firewall karena fingerprint Electron
- **Goal**: Ingin client SSH dengan fingerprint native dan keamanan tambahan

#### Use Case: Secure Connection to Target
1. Membuka aplikasi Tmax di Linux
2. Menambah koneksi baru dengan kunci ED25519 yang di-generate secara lokal
3. Menghubungkan ke server target dengan timeout 5 detik
4. Terminal menampilkan banner dengan warna yang mudah dibaca
5. Kunci privat dihapus dari memori saat aplikasi ditutup

#### Acceptance Criteria
- Fingerprint SSH native (seolah-olah menggunakan OpenSSH)
- Kunci privat tidak disimpan di disk tanpa enkripsi
- Timeout koneksi konfigurable

## 5. Prioritas Fitur (RICE Scoring)

| Fitur | Reach | Impact | Confidence | Effort | RICE Score | Status |
|-------|-------|--------|------------|--------|------------|--------|
| Vault with Encryption | 100% | 3 | 90% | 1 | 270 | MVP |
| SSH Connectivity | 100% | 3 | 85% | 1.5 | 170 | MVP |
| Terminal Emulator | 100% | 2 | 95% | 1 | 190 | MVP |
| SFTP File Explorer | 80% | 2 | 80% | 1.2 | 106 | MVP |
| AI Assistant | 60% | 3 | 70% | 1.5 | 84 | MVP Akhir |
| Webhook Notification | 40% | 2 | 80% | 1 | 64 | MVP Akhir |
| Android Support | 30% | 3 | 60% | 2 | 27 | Post-MVP |
| Cloud Sync | 50% | 3 | 50% | 3 | 25 | Post-MVP |
