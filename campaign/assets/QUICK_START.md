# ⚡ QUICK START: Capture Assets

## 🎯 3 Cara Cepat Capture Assets

### 💡 METODE PALING MUDAH (Manual dengan Tools)

#### Langkah 1: Launch App
```bash
cd /Users/peter/experiment/Tumnaxial/termiaxial
npm run tauri dev
```

#### Langkah 2: Download Tool (Choose 1)

**Option A: Loom (Recommended - Simplest)**
```
1. Buka: https://www.loom.com/download
2. Install Loom Desktop app
3. Login / Sign up (Free account cukup)
```

**Option B: CleanShot X (macOS only - Best quality)**
```
1. Buka: https://cleanshot.com/
2. Download dan install
3. Trial available
```

**Option C: GIPHY Capture (Free)**
```
1. Buka: https://giphy.com/apps/giphycapture
2. Download dan install
3. 100% Free
```

#### Langkah 3: Capture Assets

**📸 Screenshots (9 gambar - 15 minutes)**

Gunakan **Cmd+Shift+4** dan capture:
1. Vault auth screen (saat app launch)
2. Main dashboard (setelah login)
3. Terminal dengan SSH session
4. SFTP file explorer
5. Multi-tab view (3+ tabs)
6. AI assistant modal
7. Credentials list
8. Settings panel
9. Add connection dialog

Save ke: `campaign/assets/screenshots/`

**🎬 GIFs (3 GIFs - 10 minutes)**

Gunakan **Loom** atau **CleanShot X**:
1. **App startup GIF** (5 detik) - Record dari double-click sampai app loaded
2. **SSH connection GIF** (5 detik) - Record connection process
3. **SFTP transfer GIF** (10 detik) - Record drag-drop file transfer

Save ke: `campaign/assets/gifs/`

**📹 Videos (2 videos - 20 minutes)**

Gunakan **Loom** (best untuk tutorial):
1. **Demo video** (3 menit) - Walkthrough semua features
   - Intro (10s)
   - Show UI (30s)
   - Terminal demo (45s)
   - SFTP demo (45s)
   - Multi-tab demo (30s)
   - AI demo (30s)
   - Conclusion (30s)

2. **Features video** (5 menit) - Deep dive features
   - Security (1m)
   - Terminal (1m)
   - SFTP (1m)
   - Multi-tab (30s)
   - AI (45s)
   - Performance (30s)
   - Roadmap (15s)

Save ke: `campaign/assets/videos/`

---

## 🤖 METODE OTOMATIS (Script)

### Run Script
```bash
cd /Users/peter/experiment/Tumnaxial/termiaxial/campaign/scripts
bash capture_assets.sh
```

Script akan:
1. Check jika app running
2. Guide Anda step-by-step
3. Otomatis capture screenshots (jika tools tersedia)
4. Save ke folder yang benar

**Catatan:** Script butuh tools seperti `screencapture` (macOS) atau `ffmpeg`

---

## 📋 CHECKLIST RINGKAS

### Pre-capture
- [ ] Install Loom (atau tool lain)
- [ ] Launch Termiaxial (`npm run tauri dev`)
- [ ] Siapkan test SSH server (opsional)
- [ ] Siapkan test files untuk SFTP

### Capture Screenshots (9)
- [ ] 01_vault-auth.png
- [ ] 02_main-dashboard.png
- [ ] 03_terminal-view.png
- [ ] 04_sftp-explorer.png
- [ ] 05_multi-tab.png
- [ ] 06-ai-assistant.png
- [ ] 07_credentials.png
- [ ] 08_settings.png
- [ ] 09-add-connection.png

### Capture GIFs (3)
- [ ] 01-app-startup.gif (5s)
- [ ] 02-ssh-connection.gif (5s)
- [ ] 03-sftp-transfer.gif (10s)

### Capture Videos (2)
- [ ] 01-demo.mp4 (3m)
- [ ] 02-features.mp4 (5m)

### Post-capture
- [ ] Review semua assets
- [ ] Verify quality dan clarity
- [ ] Cek file sizes
- [ ] Update ASSETS_INDEX.md

---

## 💡 TIPS CEPAT

### Screenshots
- Use Cmd+Shift+4 untuk window screenshot
- Window size optimal: 1280x720
- Jangan show sensitive credentials
- Keep UI clean dan uncluttered

### GIFs
- Keep loops smooth (start = end)
- File size under 5MB
- Use 10-15 FPS
- Max 10 seconds duration

### Videos
- Use 1080p resolution
- Speak clearly (jika ada voiceover)
- Follow script di CAPTURE_GUIDE.md
- Test playback sebelum share

---

## 🎯 TIME ESTIMATE

| Task | Time |
|------|------|
| Setup tools | 10 min |
| Launch app | 5 min |
| Screenshots (9) | 15 min |
| GIFs (3) | 10 min |
| Videos (2) | 20 min |
| Review & organize | 10 min |
| **TOTAL** | **~70 min** |

---

## 📁 FOLDER STRUCTURE

Setelah selesai, Anda akan punya:

```
campaign/assets/
├── screenshots/
│   ├── 01_vault-auth.png
│   ├── 02_main-dashboard.png
│   ├── 03_terminal-view.png
│   ├── 04_sftp-explorer.png
│   ├── 05_multi-tab.png
│   ├── 06-ai-assistant.png
│   ├── 07_credentials.png
│   ├── 08_settings.png
│   └── 09-add-connection.png
├── gifs/
│   ├── 01-app-startup.gif
│   ├── 02-ssh-connection.gif
│   └── 03-sftp-transfer.gif
├── videos/
│   ├── 01-demo.mp4
│   └── 02-features.mp4
└── ASSETS_INDEX.md
```

---

## 🚀 READY TO LAUNCH!

Setelah assets captured:

1. ✅ Update campaign materials dengan assets
2. ✅ Add screenshots ke README.md
3. ✅ Add demo video ke project page
4. ✅ Launch campaign!

---

## 📞 BANTUAN

**Problem launching app?**
```bash
cd /Users/peter/experiment/Tumnaxial/termiaxial
npm install  # Install dependencies
npm run tauri dev  # Launch dev mode
```

**Problem dengan tools?**
- Check camera/screen permissions di macOS System Settings
- Try alternative tool (Loom, CleanShot X, GIPHY Capture)

**Review detailed guide:**
```bash
cat campaign/assets/CAPTURE_GUIDE.md
```

---

*Quick Start - Ready to use in 60-90 minutes!* 🚀