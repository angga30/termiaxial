# 📚 Termiaxial Asset Resources

## 📁 File Structure

```
campaign/assets/
├── UI_PREVIEW.html           ← Interactive UI preview (buka di browser)
├── CAPTURE_GUIDE.md         ← Complete capture guide (detailed)
├── QUICK_START.md           ← Quick start guide (60-90 min)
├── ASSETS_INDEX.md          ← Index of all assets (auto-generated)
├── screenshots/             ← 9 screenshots (to be captured)
├── gifs/                    ← 3 GIFs (to be captured)
└── videos/                  ← 2 videos (to be captured)
```

---

## 🎯 Start Here (Choose Your Path)

### 💡 Option 1: Quick Start (60-90 min) - RECOMMENDED

**Best for:** Quick assets capture tanpa membaca dokumentasi panjang

**Steps:**
1. Buka file: `QUICK_START.md`
2. Download tool (Loom atau CleanShot X)
3. Launch app (`npm run tauri dev`)
4. Follow quick checklist
5. Done!

**Time:** 60-90 minutes total

---

### 📖 Option 2: Detailed Guide (2-3 hours)

**Best for:** Mau capture dengan kualitas profesional

**Steps:**
1. Buka file: `CAPTURE_GUIDE.md`
2. Read semua instructions
3. Setup tools (Loom, CleanShot X, OBS)
4. Follow step-by-step guide
5. Quality check dan optimize

**Time:** 2-3 hours total

---

### 🤖 Option 3: Automated Script

**Best for:** Saya suka automation

**Steps:**
1. Launch app (`npm run tauri dev`)
2. Run script:
```bash
cd /Users/peter/experiment/Tumnaxial/termiaxial/campaign/scripts
bash capture_assets.sh
```
3. Follow on-screen instructions

**Time:** 30-60 minutes (depending on tools)

---

### 🎨 Option 4: Visual Preview

**Best for:** Mau lihat UI sebelum capture

**Steps:**
1. Buka file: `UI_PREVIEW.html` di browser
2. Lihat preview semua UI yang perlu di-capture
3. Plan positioning dan timing
4. Capture using any method above

**Time:** 15-30 minutes

---

## 📋 Assets Checklist

### 📸 Screenshots (9 needed)

| # | Asset | Status |
|---|-------|--------|
| 1 | 01_vault-auth.png | ⏳ |
| 2 | 02_main-dashboard.png | ⏳ |
| 3 | 03_terminal-view.png | ⏳ |
| 4 | 04_sftp-explorer.png | ⏳ |
| 5 | 05_multi-tab.png | ⏳ |
| 6 | 06-ai-assistant.png | ⏳ |
| 7 | 07_credentials.png | ⏳ |
| 8 | 08_settings.png | ⏳ |
| 9 | 09_add-connection.png | ⏳ |

### 🎬 GIFs (3 needed)

| # | Asset | Duration | Status |
|---|-------|----------|--------|
| 1 | 01-app-startup.gif | 5s | ⏳ |
| 2 | 02-ssh-connection.gif | 5s | ⏳ |
| 3 | 03-sftp-transfer.gif | 10s | ⏳ |

### 📹 Videos (2 needed)

| # | Asset | Duration | Status |
|---|-------|----------|--------|
| 1 | 01-demo.mp4 | 3 min | ⏳ |
| 2 | 02-features.mp4 | 5 min | ⏳ |

---

## 🛠️ Tools Required

### Must Have (All platforms)
- **Screenshot tool:** Built-in (Cmd+Shift+4)
- **Recording tool:** Loom (Free), CleanShot X (macOS), or OBS (Free)

### Optional (Better quality)
- **GIPHY Capture:** For optimized GIFs
- **QuickTime Player:** Built-in video recording (macOS)
- **ffmpeg:** For video compression

### Installation

**Loom (Recommended - Free):**
1. Visit: https://www.loom.com/download
2. Download and install
3. Sign up for free account

**CleanShot X (macOS - Paid, Trial available):**
1. Visit: https://cleanshot.com/
2. Download and install
3. 7-day trial available

**OBS Studio (Free - Cross-platform):**
```bash
# macOS
brew install --cask obs

# Linux
sudo apt install obs-studio
```

---

## 📅 Recommended Workflow

### Day 1: Setup & Quick Capture (60-90 min)
1. Install Loom (5 min)
2. Launch Termiaxial (5 min)
3. Capture 9 screenshots (15 min)
4. Capture 3 GIFs (10 min)
5. Capture 1 demo video (20 min)
6. Review & organize (10 min)

### Day 2: Quality Polish (30-60 min)
1. Review all assets (15 min)
2. Re-capture if needed (20 min)
3. Optimize file sizes (15 min)
4. Update ASSETS_INDEX.md (10 min)

### Day 3: Features Video (20-30 min)
1. Capture features walkthrough (20 min)
2. Review and edit (10 min)

---

## 🎯 Quality Standards

### Screenshots
- ✅ Clear, visible UI elements
- ✅ Consistent window size (1280x720)
- ✅ No sensitive credentials visible
- ✅ Professional appearance
- ✅ File size: 100KB-500KB

### GIFs
- ✅ Smooth loops (start = end)
- ✅ Clear, readable animations
- ✅ File size: Under 5MB
- ✅ Duration: 5-10 seconds
- ✅ FPS: 10-15

### Videos
- ✅ Clear audio (if voiceover)
- ✅ Good lighting (if face cam)
- ✅ 1080p resolution
- ✅ Smooth playback
- ✅ File size: 50MB-200MB
- ✅ Duration: 3-5 minutes

---

## ✅ Verification Checklist

### Before Capture
- [ ] Termiaxial app launched and running
- [ ] Recording tool installed and tested
- [ ] Test SSH server available (optional)
- [ ] Test files for SFTP ready
- [ ] Camera/screen permissions granted (macOS)

### After Capture
- [ ] All 9 screenshots captured
- [ ] All 3 GIFs captured
- [ ] All 2 videos captured
- [ ] All files saved to correct folders
- [ ] File names consistent
- [ ] File sizes reasonable
- [ ] Quality verified

### Before Launch
- [ ] Assets reviewed and approved
- [ ] ASSETS_INDEX.md updated
- [ ] Campaign materials updated
- [ ] Assets tested on different platforms
- [ ] Backups created

---

## 💡 Pro Tips

### Screenshots
- Use Cmd+Shift+4 for window screenshots on macOS
- Close unnecessary browser tabs/windows
- Use high-DPI display for crisp images
- Check UI elements are clearly visible

### GIFs
- Start and end at same point for smooth loop
- Keep file sizes under 5MB for web
- Use 10-15 FPS (not 30+)
- Optimize colors when possible

### Videos
- Write script before recording
- Test audio levels before final recording
- Use good lighting (for face cam)
- Keep under 10 minutes for engagement

### General
- Always test playback before publishing
- Keep consistent naming convention
- Maintain backups of originals
- Use lossless formats for editing

---

## 🚀 Next Steps After Capture

1. **Update Campaign Materials**
   - Add screenshots to README.md
   - Embed demo video on project page
   - Update campaign templates with assets

2. **Test Across Platforms**
   - Verify images load correctly on GitHub
   - Test GIFs on Twitter/X
   - Test videos on Dev.to/Hashnode

3. **Launch Campaign**
   - Update social media posts with assets
   - Publish blog posts with screenshots
   - Share videos on YouTube/LinkedIn

---

## 📞 Support

**Quick Help:**
- Buka `QUICK_START.md` untuk panduan cepat
- Buka `UI_PREVIEW.html` untuk visual preview

**Detailed Help:**
- Buka `CAPTURE_GUIDE.md` untuk panduan lengkap
- Run `bash capture_assets.sh` untuk automation

**Common Issues:**
- App not launching? Run `npm install && npm run tauri dev`
- Screen permissions? Check macOS System Settings
- Tools not working? Try alternative (Loom vs CleanShot vs OBS)

---

## 📊 Progress Tracker

Total Assets Needed: 14 (9 screenshots + 3 GIFs + 2 videos)

Current Progress:
- Screenshots: 0/9 (0%)
- GIFs: 0/3 (0%)
- Videos: 0/2 (0%)
- Overall: 0/14 (0%)

**Estimated Time Remaining:** 60-180 minutes

---

## 🎉 Ready to Capture!

Choose your path above and start capturing assets!

---

*Last updated: 2025-05-25*
*Status: Ready for execution*