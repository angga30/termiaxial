# 🖼️ PANDUAN CAPTURE ASSETS TERMIAXIAL

## 📋 DAFTAR ASSETS YANG DIBUTUHKAN

### 📸 Screenshots (9 gambar)

| No | Nama File | Deskripsi | Status |
|----|-----------|-----------|--------|
| 1 | `01_vault-auth.png` | Screen vault authentication | ⏳ Belum |
| 2 | `02_main-dashboard.png` | Main application dashboard | ⏳ Belum |
| 3 | `03_terminal-view.png` | Terminal dengan SSH session | ⏳ Belum |
| 4 | `04_sftp-explorer.png` | SFTP dual-panel file explorer | ⏳ Belum |
| 5 | `05_multi-tab.png` | Multiple terminal tabs | ⏳ Belum |
| 6 | `06-ai-assistant.png` | AI assistant modal | ⏳ Belum |
| 7 | `07_credentials.png` | Credential vault | ⏳ Belum |
| 8 | `08_settings.png` | Settings dan preferences | ⏳ Belum |
| 9 | `09-add-connection.png` | Add new SSH connection dialog | ⏳ Belum |

---

### 🎬 GIF Animations (3 GIF)

| No | Nama File | Deskripsi | Durasi | Status |
|----|-----------|-----------|--------|--------|
| 1 | `01-app-startup.gif` | App startup (show fast launch) | 5 detik | ⏳ Belum |
| 2 | `02-ssh-connection.gif` | SSH connection process | 5 detik | ⏳ Belum |
| 3 | `03-sftp-transfer.gif` | SFTP file transfer | 10 detik | ⏳ Belum |

---

### 📹 Demo Videos (2 video)

| No | Nama File | Deskripsi | Durasi | Status |
|----|-----------|-----------|--------|--------|
| 1 | `01-demo.mp4` | Full demo video | 3 menit | ⏳ Belum |
| 2 | `02-features.mp4` | Feature walkthrough | 5 menit | ⏳ Belum |

---

## 🚀 METODE CAPTURE

### METODE 1: OTOMATIS (Recommended)

#### Step 1: Launch Termiaxial
```bash
cd /Users/peter/experiment/Tumnaxial/termiaxial
npm run tauri dev
```

#### Step 2: Jalankan Script Capture
```bash
cd /Users/peter/experiment/Tumnaxial/termiaxial/campaign/scripts
bash capture_assets.sh
```

Script akan:
1. Otomatis check apakah app running
2. Guide Anda step-by-step untuk capture
3. Menyimpan ke folder yang tepat

#### Step 3: Follow On-screen Instructions
- Script akan memberikan instruksi untuk setiap capture
- Tunggu 3-5 detik untuk positioning window
- Script akan otomatis capture (jika tools tersedia)

---

### METODE 2: MANUAL (Fallback)

#### Screenshots (macOS)

**Cara 1: Screenshot Full Window**
```
Cmd + Shift + 4
Klik pada window Termiaxial
```

**Cara 2: Screenshot Selection**
```
Cmd + Shift + 4
Drag untuk select area
```

**Cara 3: Screenshot dengan Delay**
```bash
# Buka terminal baru
screencapture -T 5 -x -t png ~/Desktop/screenshot.png
# 5 detik delay sebelum capture
```

#### GIF Recording

**Option 1: Loom (Recommended)**
1. Download: https://www.loom.com/download
2. Install Loom Desktop app
3. Klik "Record" → "Custom Recording"
4. Select window: Termiaxial
5. Record 5-10 seconds
6. Save as `.gif` (Loom supports export to GIF)

**Option 2: CleanShot X**
1. Download: https://cleanshot.com/
2. Install CleanShot X
3. Use GIF recording feature
4. Record window or selection
5. Save as `.gif`

**Option 3: GIPHY Capture**
1. Download: https://giphy.com/apps/giphycapture
2. Install GIPHY Capture
3. Select recording area
4. Record 5-10 seconds
5. Save as `.gif`

#### Video Recording

**Option 1: Loom (Recommended)**
1. Open Loom app
2. Klik "New Recording"
3. Pilih "Custom Recording"
4. Select: Window (Termiaxial)
5. Check "System Audio" (jika perlu)
6. Check "Microphone" (untuk voiceover)
7. Click "Start Recording"
8. Demo semua features (3-5 menit)
9. Click "Stop Recording"
10. Review dan save

**Option 2: QuickTime (macOS built-in)**
```bash
# Buka QuickTime Player
Cmd + Space → QuickTime Player

# New Screen Recording
File → New Screen Recording

# Select window
Click arrow → Select Window

# Start recording
Click Record → Select Termiaxial window

# Stop recording
Cmd + Ctrl + Esc (stop recording shortcut)
```

**Option 3: OBS Studio**
1. Download: https://obsproject.com/
2. Install OBS
3. Add "Window Capture" source
4. Select Termiaxial window
5. Set resolution (1920x1080 recommended)
6. Start Recording
7. Demo features
8. Stop Recording
9. Save video

---

## 📂 STRUKTUR FOLDER

Setelah capture, folder structure akan seperti ini:

```
campaign/
├── assets/
│   ├── screenshots/         ← 9 PNG files
│   │   ├── 01_vault-auth.png
│   │   ├── 02_main-dashboard.png
│   │   ├── 03_terminal-view.png
│   │   ├── 04_sftp-explorer.png
│   │   ├── 05_multi-tab.png
│   │   ├── 06-ai-assistant.png
│   │   ├── 07_credentials.png
│   │   ├── 08_settings.png
│   │   └── 09-add-connection.png
│   ├── gifs/                 ← 3 GIF files
│   │   ├── 01-app-startup.gif
│   │   ├── 02-ssh-connection.gif
│   │   └── 03-sftp-transfer.gif
│   ├── videos/               ← 2 MP4 files
│   │   ├── 01-demo.mp4
│   │   └── 02-features.mp4
│   └── ASSETS_INDEX.md       ← Index file
├── scripts/
│   └── capture_assets.sh     ← Automation script
└── UI_PREVIEW.html           ← UI Preview (buka di browser)
```

---

## 📝 DETAIL CAPTURE SETIAP ASSET

### 📸 Screenshots Detail

#### 1. Vault Auth (`01_vault-auth.png`)
**Tujuan:** Show security/encryption UI
**Steps:**
1. Buka Termiaxial (fresh launch)
2. Screen akan menampilkan vault authentication
3. Capture saat password field visible
**Tip:** Pastikan UI terlihat clean dan modern

#### 2. Main Dashboard (`02_main-dashboard.png`)
**Tujuan:** Show main interface layout
**Steps:**
1. Login ke vault (gunakan test password)
2. Screen akan show main dashboard
3. Pastikan sidebar, topbar, dan main area visible
**Tip:** Window size optimal (1280x720)

#### 3. Terminal View (`03_terminal-view.png`)
**Tujuan:** Show terminal in action
**Steps:**
1. Connect ke SSH server (bisa localhost untuk test)
2. Jalankan beberapa commands (ls, pwd, whoami)
3. Capture dengan command output visible
**Tip:** Gunakan warna terminal yang kontras

#### 4. SFTP Explorer (`04_sftp-explorer.png`)
**Tujuan:** Show file transfer capabilities
**Steps:**
1. Switch ke SFTP view
2. Pastikan dual-panel visible
3. Show beberapa files/folders
4. Capture dengan file hierarchy clear
**Tip:** Show different file types (files, folders, hidden files)

#### 5. Multi-Tab View (`05_multi-tab.png`)
**Tujuan:** Show multi-session capability
**Steps:**
1. Buka 3+ SSH sessions (bisa same server, different tabs)
2. Buka 1 SFTP session
3. Arrange tabs di top
4. Capture dengan semua tabs visible
**Tip:** Give tabs descriptive names

#### 6. AI Assistant (`06-ai-assistant.png`)
**Tujuan:** Show AI features
**Steps:**
1. Jalankan command yang menghasilkan error
2. Buka AI assistant (Ctrl+Space atau click icon)
3. Show AI analysis/suggestion
4. Capture dengan AI modal open
**Tip:** Use a realistic scenario

#### 7. Credentials (`07_credentials.png`)
**Tujuan:** Show credential management
**Steps:**
1. Switch ke Credentials view
2. Show list of saved credentials
3. Pastikan credential details visible (tanpa expose password)
4. Capture dengan vault interface
**Tip:** Show 3-5 credentials for variety

#### 8. Settings (`08_settings.png`)
**Tujuan:** Show configuration options
**Steps:**
1. Buka Settings panel
2. Expand several sections (Appearance, Terminal, Security)
3. Show various options
4. Capture dengan modern settings UI
**Tip:** Show toggle switches and dropdowns

#### 9. Add Connection (`09-add-connection.png`)
**Tujuan:** Show how to add new SSH connection
**Steps:**
1. Click "Add Connection" button
2. Fill in some fields (host, username, etc.)
3. Leave password/key fields empty (security)
4. Capture dengan dialog open
**Tip:** Show validation hints if available

---

### 🎬 GIFs Detail

#### 1. App Startup (`01-app-startup.gif`)
**Tujuan:** Show fast launch time
**Steps:**
1. Close Termiaxial completely
2. Start screen recording
3. Launch Termiaxial app
4. Record dari icon double-click sampai app fully loaded
5. Stop recording (~5 seconds)
**Duration:** 3-5 seconds
**Tip:** Pastikan clock/timer visible untuk show speed

#### 2. SSH Connection (`02-ssh-connection.gif`)
**Tujuan:** Show connection process
**Steps:**
1. Open "Add Connection" dialog
2. Fill in credentials (quickly)
3. Click "Connect"
4. Show connection progress
5. Terminal opens and prompt appears
6. Stop recording
**Duration:** 5-7 seconds
**Tip:** Pre-fill credentials or use saved ones for speed

#### 3. SFTP Transfer (`03-sftp-transfer.gif`)
**Tujuan:** Show file transfer
**Steps:**
1. Open SFTP explorer
2. Select file dari left panel
3. Drag ke right panel
4. Show progress bar
5. File berhasil transfer
6. Stop recording
**Duration:** 8-12 seconds
**Tip:** Use small file (100KB-1MB) untuk fast transfer

---

### 📹 Videos Detail

#### 1. Full Demo (`01-demo.mp4`)
**Tujuan:** Complete feature overview
**Script:**

```
[INTRO - 10 seconds]
"Hi, I'm showing Termiaxial - an ultra-lightweight SSH client
built with Rust and Tauri v2 that runs on just 50MB of RAM."

[VAULT - 15 seconds]
"First, you're greeted with the vault authentication.
All credentials are encrypted with AES-256-GCM."

[MAIN DASHBOARD - 15 seconds]
"After unlocking, you see the main dashboard with sidebar,
topbar, and main view area. Clean, modern interface."

[TERMINAL - 30 seconds]
"Let me connect to a server. Terminal shows full color support,
5000-line scrollback, and works exactly like a real terminal."

[SFTP - 30 seconds]
"Switching to SFTP view shows dual-panel file explorer.
Drag-and-drop file transfers, recursive sync, all included."

[MULTI-TAB - 15 seconds]
"You can have multiple sessions open. Here I have 3 SSH
sessions and 1 SFTP session running simultaneously."

[AI ASSISTANT - 20 seconds]
"If you encounter errors, hit Ctrl+Space to open the AI assistant.
It analyzes terminal output and provides suggestions."

[CREDENTIALS - 15 seconds]
"All your credentials are stored in encrypted vault.
Easy to manage, search, and organize."

[PERFORMANCE - 20 seconds]
"Key advantage: only 50MB RAM vs 200MB+ for Electron apps.
Fast startup, native performance, no bloat."

[CONCLUSION - 20 seconds]
"Termiaxial is open source, MIT licensed, and free forever.
Check out the GitHub repository to contribute or star the project."

[OUTRO - 10 seconds]
"Built with Rust, Tauri v2, and love for performance."
```

**Duration:** 3 minutes
**Audio:** Optional (voiceover recommended)
**Resolution:** 1920x1080

#### 2. Feature Walkthrough (`02-features.mp4`)
**Tujuan:** Deep dive into features
**Script:**

```
[PART 1: SECURITY - 1 minute]
"Termiaxial takes security seriously.
Master password with Argon2id hashing (12 rounds).
AES-256-GCM encryption for all credentials.
Local SQLite storage (no cloud by default).
Zero-knowledge sync architecture."

[PART 2: TERMINAL - 1 minute]
"Terminal emulator powered by Xterm.js.
Full 256-color support.
5000-line scrollback buffer.
Paste and copy support.
Resize terminal window dynamically."

[PART 3: SFTP - 1 minute]
"SFTP file explorer with dual-panel.
Drag-and-drop file transfers.
Recursive directory synchronization.
Resume interrupted transfers.
Progress tracking and speed indicator."

[PART 4: MULTI-TAB - 30 seconds]
"Multi-tab session management.
Switch between sessions instantly.
Auto-reconnect on connection loss.
Persistent connection state."

[PART 5: AI ASSISTANT - 45 seconds]
"AI assistant supports OpenAI, Ollama, and Anthropic.
Analyze terminal errors.
Get command suggestions.
Parse log files.
Understand complex outputs."

[PART 6: PERFORMANCE - 30 seconds]
"Benchmarks show 10x better memory usage.
50MB RAM idle, <1.5s startup.
Native performance with Rust backend.
Cross-platform builds for macOS, Linux, Windows."

[PART 7: ROADMAP - 15 seconds]
"Coming soon: SSH Tunneling, Snippet Manager,
Session Recording, Cloud Sync, Team Collaboration."

[CONCLUSION - 30 seconds]
"Open source, community-driven, built for developers."
```

**Duration:** 5 minutes
**Audio:** Optional (voiceover recommended)
**Resolution:** 1920x1080

---

## 🎨 TIPS & TRICKS

### Screenshots
- ✅ Use consistent window size (1280x720)
- ✅ Clean up unnecessary windows/tabs
- ✅ Use high-DPI display for crisp images
- ✅ Include visible UI elements (buttons, inputs)
- ❌ Don't show sensitive credentials
- ❌ Don't show production server IPs

### GIFs
- ✅ Keep loops smooth (start/end match)
- ✅ Keep file size under 5MB for web
- ✅ Use 10-15 FPS for GIFs
- ✅ Optimize colors (reduce palette)
- ❌ Don't make GIFs too long (max 10 seconds)
- ❌ Don't include sensitive info

### Videos
- ✅ Use good lighting (for face cam)
- ✅ Use clear audio (voiceover)
- ✅ Use high resolution (1080p)
- ✅ Add captions for accessibility
- ✅ Keep under 10 minutes
- ❌ Don't include sensitive credentials
- ❌ Don't show production servers

### General
- ✅ Test playback before publishing
- ✅ Organize files with consistent naming
- ✅ Keep backups of original files
- ✅ Use lossless formats for editing
- ❌ Don't compress too aggressively

---

## 🔧 TOOLS RECOMMENDED

### macOS (Recommended)
```
Screenshots: Cmd+Shift+4 (built-in)
GIFs:        CleanShot X, Loom, GIPHY Capture
Videos:      QuickTime (built-in), Loom, OBS
```

### Cross-platform
```
GIFs:    Loom, Kap, ScreenToGif (Windows)
Videos:  OBS Studio, Loom, ShareX (Windows)
```

### Installation

**CleanShot X:**
```bash
# Download from https://cleanshot.com/
# Install and grant screen recording permissions
```

**Loom:**
```bash
# Download from https://www.loom.com/download
# Install and sign up for free account
```

**OBS Studio:**
```bash
# macOS
brew install --cask obs

# Linux
sudo apt install obs-studio
```

---

## ✅ CHECKLIST SELESAI

Setelah capture selesai, verify:

### Screenshots (9)
- [ ] Semua 9 screenshots captured
- [ ] Semua screenshots clear dan visible
- [ ] UI elements clearly visible
- [ ] Tidak ada sensitive info
- [ ] File sizes reasonable (100KB-500KB)

### GIFs (3)
- [ ] Semua 3 GIFs captured
- [ ] GIFs loop smoothly
- [ ] File sizes under 5MB
- [ ] Durasi appropriate (5-10 seconds)
- [ ] Animations clear dan smooth

### Videos (2)
- [ ] Semua 2 videos captured
- [ ] Audio clear (jika ada)
- [ ] Video quality good (1080p)
- [ ] Durasi appropriate (3-5 menit)
- [ ] File sizes reasonable (50MB-200MB)

### Organization
- [ ] Semua files di folder yang benar
- [] Naming consistent
- [ ] Index file updated (ASSETS_INDEX.md)

---

## 🚀 READY TO USE

Setelah semua assets captured:

### For Social Media
- Use screenshots for Twitter/X posts
- Use GIFs for LinkedIn posts
- Use videos for Dev.to/Hashnode

### For GitHub
- Add screenshots to README.md
- Add demo video to project page
- Add GIFs to documentation

### For Launch
- Update campaign materials with assets
- Add assets to blog posts
- Include in launch announcements

---

## 💡 NEXT STEPS

1. ✅ Capture semua assets (estimated: 1-2 hours)
2. ✅ Review dan optimize assets (30 minutes)
3. ✅ Update campaign materials (15 minutes)
4. ✅ Test assets in different platforms (15 minutes)
5. ✅ Launch campaign! 🚀

---

*Total estimated time: 2-3 hours for complete asset capture*

*Created: 2025-05-25*
*Status: Ready for execution*