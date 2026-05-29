#!/bin/bash

# Asset Capture Script for Termiaxial
# Captures screenshots, GIFs, and demo videos automatically

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/Users/peter/experiment/Tumnaxial/termiaxial"
ASSETS_DIR="${PROJECT_DIR}/campaign/assets"
SCREENSHOTS_DIR="${ASSETS_DIR}/screenshots"
GIFS_DIR="${ASSETS_DIR}/gifs"
VIDEOS_DIR="${ASSETS_DIR}/videos"

# Create directories
echo -e "${BLUE}Creating asset directories...${NC}"
mkdir -p "${SCREENSHOTS_DIR}"
mkdir -p "${GIFS_DIR}"
mkdir -p "${VIDEOS_DIR}"

echo -e "${GREEN}✓ Asset directories created${NC}"
echo -e "  Screenshots: ${SCREENSHOTS_DIR}"
echo -e "  GIFs: ${GIFS_DIR}"
echo -e "  Videos: ${VIDEOS_DIR}"
echo ""

# Check if Tauri app is running
echo -e "${BLUE}Checking if Termiaxial is running...${NC}"
if pgrep -x "termiaxial" > /dev/null; then
    echo -e "${GREEN}✓ Termiaxial is running${NC}"
    APP_PID=$(pgrep -x "termiaxial")
    echo -e "  PID: ${APP_PID}"
else
    echo -e "${YELLOW}⚠ Termiaxial is not running${NC}"
    echo -e "${YELLOW}  Starting Tauri dev server...${NC}"
    cd "${PROJECT_DIR}"
    npm run tauri dev &
    TAURI_PID=$!
    sleep 30  # Wait for app to launch

    if ! pgrep -x "termiaxial" > /dev/null; then
        echo -e "${RED}✗ Failed to start Termiaxial${NC}"
        echo -e "${YELLOW}  Please start manually: cd ${PROJECT_DIR} && npm run tauri dev${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Termiaxial started${NC}"
fi
echo ""

# Check for screenshot tools
echo -e "${BLUE}Checking for screenshot tools...${NC}"

if command -v screencapture &> /dev/null; then
    SCREENSHOT_CMD="screencapture"
    echo -e "${GREEN}✓ screencapture available (macOS)${NC}"
else
    echo -e "${YELLOW}⚠ screencapture not found${NC}"
    echo -e "${YELLOW}  Using alternative method...${NC}"
    SCREENSHOT_CMD=""
fi

if command -v /System/Applications/Utilities/Screen\ Recording.app &> /dev/null; then
    VIDEO_CMD="screen recording"
    echo -e "${GREEN}✓ Screen Recording app available${NC}"
else
    echo -e "${YELLOW}⚠ Screen Recording app not found${NC}"
    VIDEO_CMD=""
fi

if command -v ffmpeg &> /dev/null; then
    echo -e "${GREEN}✓ ffmpeg available${NC}"
    HAS_FFMPEG=true
else
    echo -e "${YELLOW}⚠ ffmpeg not found${NC}"
    echo -e "${YELLOW}  Install with: brew install ffmpeg${NC}"
    HAS_FFMPEG=false
fi
echo ""

# Function to capture screenshot
capture_screenshot() {
    local filename=$1
    local description=$2
    local wait_seconds=${3:-3}

    echo -e "${BLUE}Capturing: ${description}${NC}"
    echo -e "${YELLOW}  Wait ${wait_seconds} seconds to position window...${NC}"
    sleep $wait_seconds

    if [ -n "$SCREENSHOT_CMD" ]; then
        $SCREENSHOT_CMD -x -t png "${SCREENSHOTS_DIR}/${filename}.png"
        echo -e "${GREEN}✓ Saved: ${filename}.png${NC}"
    else
        echo -e "${YELLOW}⚠ Manual capture needed: ${filename}.png${NC}"
        echo -e "  Please capture screenshot and save to: ${SCREENSHOTS_DIR}/${filename}.png"
        read -p "Press Enter when done..."
    fi
    echo ""
}

# Function to capture GIF
capture_gif() {
    local filename=$1
    local description=$2
    local duration=${3:-5}

    echo -e "${BLUE}Capturing GIF: ${description}${NC}"
    echo -e "${YELLOW}  Duration: ${duration} seconds${NC}"

    if [ "$HAS_FFMPEG" = true ]; then
        # Using ffmpeg to capture screen
        ffmpeg -f avfoundation -i "1" -t $duration -pix_fmt rgb24 "${GIFS_DIR}/${filename}.mp4" 2>/dev/null || true

        # Convert to GIF if possible
        if [ -f "${GIFS_DIR}/${filename}.mp4" ]; then
            echo -e "${GREEN}✓ Saved: ${filename}.mp4 (video)${NC}"
            echo -e "${YELLOW}  Convert to GIF with: ffmpeg -i ${GIFS_DIR}/${filename}.mp4 -vf 'fps=10,scale=480:-1:flags=lanczos' -c:v gif ${GIFS_DIR}/${filename}.gif${NC}"
        else
            echo -e "${YELLOW}⚠ Manual capture needed${NC}"
            echo -e "  Please record ${duration}s and save to: ${GIFS_DIR}/${filename}.gif"
            read -p "Press Enter when done..."
        fi
    else
        echo -e "${YELLOW}⚠ Please use Loom or GIPHY Capture${NC}"
        echo -e "  Record ${duration} seconds and save to: ${GIFS_DIR}/${filename}.gif"
        read -p "Press Enter when done..."
    fi
    echo ""
}

# Function to capture video
capture_video() {
    local filename=$1
    local description=$2
    local duration=${3:-120}

    echo -e "${BLUE}Recording video: ${description}${NC}"
    echo -e "${YELLOW}  Duration: ${duration} seconds (2 minutes)${NC}"

    echo -e "${YELLOW}⚠ Please use Loom or QuickTime for video recording${NC}"
    echo -e "  Record ${duration} seconds and save to: ${VIDEOS_DIR}/${filename}.mp4"
    read -p "Press Enter when done..."
    echo ""
}

# Main capture sequence
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   ASSET CAPTURE SEQUENCE${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# Step 1: Launch & Authentication
echo -e "${BLUE}═══ STEP 1: Launch & Authentication ═══${NC}"
capture_screenshot "01_vault-auth" "Vault authentication screen" 3

# Step 2: Main Dashboard
echo -e "${BLUE}═══ STEP 2: Main Dashboard ═══${NC}"
capture_screenshot "02_main-dashboard" "Main application dashboard" 3

# Step 3: Terminal View
echo -e "${BLUE}═══ STEP 3: Terminal View ═══${NC}"
capture_screenshot "03_terminal-view" "Terminal with SSH session" 5

# Step 4: SFTP File Explorer
echo -e "${BLUE}═══ STEP 4: SFTP File Explorer ═══${NC}"
capture_screenshot "04_sftp-explorer" "SFTP dual-panel file explorer" 3

# Step 5: Multi-tab View
echo -e "${BLUE}═══ STEP 5: Multi-tab View ═══${NC}"
capture_screenshot "05_multi-tab" "Multiple terminal tabs" 3

# Step 6: AI Assistant
echo -e "${BLUE}═══ STEP 6: AI Assistant ═══${NC}"
capture_screenshot "06-ai-assistant" "AI assistant modal" 3

# Step 7: Credentials View
echo -e "${BLUE}═══ STEP 7: Credentials View ═══${NC}"
capture_screenshot "07-credentials" "Credential vault" 3

# Step 8: Settings
echo -e "${BLUE}═══ STEP 8: Settings ═══${NC}"
capture_screenshot "08-settings" "Settings and preferences" 3

# Step 9: Add SSH Connection
echo -e "${BLUE}═══ STEP 9: Add SSH Connection ═══${NC}"
capture_screenshot "09-add-connection" "Add new SSH connection dialog" 3

# GIFs
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   GIF CAPTURE${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# GIF 1: App Startup
capture_gif "01-app-startup" "App startup (show fast launch)" 5

# GIF 2: SSH Connection
capture_gif "02-ssh-connection" "SSH connection process" 5

# GIF 3: SFTP File Transfer
capture_gif "03-sftp-transfer" "SFTP file transfer" 10

# Videos
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   VIDEO CAPTURE${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# Video 1: Demo Video
capture_video "01-demo" "Full demo video" 180

# Video 2: Feature Walkthrough
capture_video "02-features" "Feature walkthrough" 300

# Summary
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   CAPTURE COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Assets captured:${NC}"
echo -e "  Screenshots: ${SCREENSHOTS_DIR}"
ls -1 "${SCREENSHOTS_DIR}" | wc -l | xargs -I {} echo "    - {} screenshots"
echo -e "  GIFs: ${GIFS_DIR}"
ls -1 "${GIFS_DIR}" | wc -l | xargs -I {} echo "    - {} GIFs"
echo -e "  Videos: ${VIDEOS_DIR}"
ls -1 "${VIDEOS_DIR}" | wc -l | xargs -I {} echo "    - {} videos"
echo ""

# Create index file
cat > "${ASSETS_DIR}/ASSETS_INDEX.md" << EOF
# Termiaxial Assets Index

## 📸 Screenshots

| # | Filename | Description |
|---|----------|-------------|
| 1 | \`01_vault-auth.png\` | Vault authentication screen |
| 2 | \`02_main-dashboard.png\` | Main application dashboard |
| 3 | \`03_terminal-view.png\` | Terminal with SSH session |
| 4 | \`04_sftp-explorer.png\` | SFTP dual-panel file explorer |
| 5 | \`05_multi-tab.png\` | Multiple terminal tabs |
| 6 | \`06-ai-assistant.png\` | AI assistant modal |
| 7 | \`07_credentials.png\` | Credential vault |
| 8 | \`08_settings.png\` | Settings and preferences |
| 9 | \`09-add-connection.png\` | Add new SSH connection dialog |

## 🎬 GIFs

| # | Filename | Description | Duration |
|---|----------|-------------|----------|
| 1 | \`01-app-startup.gif\` | App startup (show fast launch) | 5s |
| 2 | \`02-ssh-connection.gif\` | SSH connection process | 5s |
| 3 | \`03-sftp-transfer.gif\` | SFTP file transfer | 10s |

## 📹 Videos

| # | Filename | Description | Duration |
|---|----------|-------------|----------|
| 1 | \`01-demo.mp4\` | Full demo video | 3 min |
| 2 | \`02-features.mp4\` | Feature walkthrough | 5 min |

---

**Total:** 9 screenshots + 3 GIFs + 2 videos = **14 assets**

*Created: $(date)*
EOF

echo -e "${GREEN}✓ Assets index created: ${ASSETS_DIR}/ASSETS_INDEX.md${NC}"
echo ""

# Display file sizes
echo -e "${BLUE}File sizes:${NC}"
for dir in "${SCREENSHOTS_DIR}" "${GIFS_DIR}" "${VIDEOS_DIR}"; do
    if [ -d "$dir" ] && [ "$(ls -A "$dir" 2>/dev/null)" ]; then
        echo ""
        echo -e "${YELLOW}${dir}:${NC}"
        du -h "$dir"/* 2>/dev/null | tail -5
    fi
done

echo ""
echo -e "${GREEN}✓ Asset capture complete!${NC}"
echo -e "${YELLOW}  All assets saved to: ${ASSETS_DIR}${NC}"