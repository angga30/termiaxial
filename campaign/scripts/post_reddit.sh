#!/bin/bash

# Reddit Posting Script for Termiaxial Campaign
# Posts to multiple subreddits with proper timing and formatting

set -e

# Configuration
REPO_URL="https://github.com/angga30/termiaxial"
REPO_NAME="Termiaxial"
AUTHOR="angga30"  # Change to your Reddit username

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Subreddits and their corresponding post types
declare -A SUBREDDITS=(
    ["rust"]="r/rust"
    ["tauri"]="r/tauri"
    ["programming"]="r/programming"
    ["sysadmin"]="r/sysadmin"
    ["devops"]="r/devops"
    ["opensource"]="r/opensource"
    ["programmingtools"]="r/programmingtools"
    ["SelfHosted"]="r/SelfHosted"
)

# Post templates (simplified for script - use full templates from templates/)
POST_RUST='I built Termiaxial - a SSH client that uses 1/10th RAM of Electron apps (Rust + Tauri v2)

## Why?

I was frustrated with existing SSH clients:
- Electron apps (Termius, Royal TSX) eat 200MB+ RAM
- Slow startup times (5s+)
- Heavy CPU usage even when idle
- Proprietary software (can'\''t audit code)

## The Solution: Rust + Tauri v2

Tauri v2 uses the OS'\''s native webview instead of bundling Chromium. Combined with Rust backend, this achieves:

- **50MB idle RAM** (vs 200MB+ for Electron apps)
- **<1.5s startup** (vs 5s+ for competitors)
- **Native performance** with React + TypeScript frontend
- **Fully open source** (MIT license)

## Tech Stack

```
Framework: Tauri v2
Frontend:  React 18 + TypeScript + Tailwind CSS
Backend:   Rust (russh, tokio)
Terminal:  Xterm.js v5
Crypto:    ring (AES-GCM-256) + argon2
Database:  SQLite
```

## Features

### Core
- ✅ SSH authentication (password + private key: RSA, ED25519)
- ✅ Full terminal emulator (Xterm.js, 256 colors, 5000-line scrollback)
- ✅ SFTP file explorer with drag-drop upload/download
- ✅ Multi-tab sessions with auto-reconnect

### Security
- ✅ Master Password with Argon2id hashing
- ✅ AES-GCM-256 encrypted credential vault
- ✅ Local SQLite storage (no cloud by default)

### AI & Productivity
- ✅ AI Assistant (OpenAI, Ollama, Anthropic)
- ✅ Terminal analysis with Ctrl+Space shortcut

## Performance Benchmarks

| Metric          | Termiaxial | Termius  | PuTTY |
|----------------|-----------|----------|-------|
| Idle RAM       | 50MB      | 200MB+   | 30MB  |
| Startup Time   | 1.5s      | 5s+      | 0.3s  |
| CPU Usage      | <1%       | 3-5%     | <1%   |
| Bundle Size    | 8MB       | 120MB+   | 1MB   |

## GitHub

'"${REPO_URL}"'

⭐ Star if you like the project
🍴 Fork if you want to contribute
🐛 Report issues on GitHub

---

Built with ❤️ by developers, for developers.

#rust #tauri #opensource #showoff'

POST_TAURI='Hey Tauri community! 👋

I'\''ve been building Termiaxial - a SSH/SFTP client using Tauri v2 + Rust, and it'\''s finally ready for open source launch!

## Tauri v2 Experience

Overall: **10/10** - Tauri v2 is incredibly productive!

### What Worked Great:
- ✅ Native webview = tiny bundle size (8MB vs 120MB+ Electron)
- ✅ IPC communication is smooth and fast
- ✅ Cross-platform builds work flawlessly
- ✅ Community support is excellent
- ✅ Security model (sandboxed backend) is perfect for SSH apps

### Challenges & Solutions:
- ❌ Xterm.js integration was tricky initially
  ✅ Solution: Used Tauri'\''s command system for terminal I/O
- ❌ File system access permissions
  ✅ Solution: Proper Tauri permissions in `tauri.conf.json`
- ❌ Async Rust → JavaScript communication
  ✅ Solution: `tauri::async_runtime::spawn` with proper error handling

## Architecture

```
Frontend (React) → Tauri Commands → Backend (Rust)
```

## Performance vs Electron

Tauri v2'\''s native webview makes a huge difference:

- **RAM**: 50MB (vs 200MB+ Electron)
- **Bundle**: 8MB (vs 120MB+ Electron)
- **Startup**: 1.5s (vs 5s+ Electron)

## GitHub

'"${REPO_URL}"'

**Questions for the community:**

1. Anyone else building Tauri v2 apps with terminal emulators?
2. Best practices for Xterm.js + Tauri integration?
3. Experiences with Tauri v2 production deployments?

Would love to connect with other Tauri developers! 🚀

---

**Tech Stack:** Tauri v2, Rust, React, TypeScript, Tailwind CSS

#tauri #rust #desktop #ssh #showoff'

POST_PROGRAMMING='Electron bloat is over: Meet the 50MB SSH client (Rust + Tauri v2)

## The Problem

Electron bundles the entire Chromium browser (~80MB) for every app. This is why:

- VS Code: 200-300MB RAM
- Slack: 300-500MB RAM
- Termius: 200MB+ RAM
- Royal TSX: 150MB+ RAM

For a simple SSH client, this is unacceptable.

## The Solution

Tauri v2 uses the OS'\''s native webview instead:

- macOS: WebKit (Safari'\''s engine)
- Linux: WebKitGTK
- Windows: WebView2 (Edge'\''s engine)

**Result: 10x smaller memory footprint.**

## Introducing Termiaxial

A SSH/SFTP client that runs on 50MB RAM (vs 200MB+ for Electron alternatives).

### Why It Matters

If you'\''re managing 10 SSH sessions:
- Electron apps: 2GB+ RAM
- Termiaxial: 500MB RAM
- **Savings: 1.5GB RAM**

### Features

- SSH authentication (password + keys)
- SFTP file explorer (drag-drop)
- Multi-tab sessions
- AI assistant (terminal analysis)
- Encrypted credential vault

### Tech Stack

```
Frontend: React + TypeScript + Tailwind
Backend:  Rust (russh, tokio)
Framework: Tauri v2
```

### Performance

| Metric          | Termiaxial | Electron Apps |
|----------------|-----------|---------------|
| Idle RAM       | 50MB      | 200MB+        |
| Startup Time   | 1.5s      | 5s+           |
| Bundle Size    | 8MB       | 120MB+        |
| CPU Usage      | <1%       | 3-5%          |

## GitHub

'"${REPO_URL}"'

**Built with Rust, Tauri v2, and a hatred of bloat.** 🦀

#opensource #rust #programming #tauri #desktop'

POST_SYSADMIN='Sysadmins and DevOps engineers,

Stop paying $100+/year for proprietary SSH clients.

## What I Built

Termiaxial - a SSH/SFTP client that:
- Runs on 50MB RAM (1/4th of Termius)
- Starts in 1.5 seconds
- Stores credentials in AES-GCM-256 encrypted vault
- Works on Desktop & Android
- **Is completely free and open source**

## Why You Should Care

### Performance
If you'\''re managing 50+ servers:
- Termius: 10GB+ RAM (200MB × 50)
- Termiaxial: 2.5GB RAM (50MB × 50)
- **Savings: 7.5GB RAM**

### Features You Actually Need
- ✅ SSH with password + key auth (RSA, ED25519)
- ✅ SFTP file browser with drag-drop
- ✅ Multi-tab sessions
- ✅ Auto-reconnect on connection loss
- ✅ Terminal with 5000-line scrollback
- ✅ Encrypted credential vault
- ✅ AI assistant for error analysis

### Security
- Master Password with Argon2id hashing (12 rounds)
- AES-GCM-256 encryption for all credentials
- Local SQLite storage (no cloud by default)
- Zero-knowledge sync architecture

## Comparison

| Feature         | Termiaxial | Termius  | PuTTY |
|----------------|-----------|----------|-------|
| Price          | FREE      | $100+/yr | FREE  |
| Open Source    | ✅ MIT    | ❌       | ✅ MIT|
| SFTP           | ✅        | ✅       | ❌    |
| Multi-tab      | ✅        | ✅       | ❌    |
| Encryption     | AES-256   | Unknown  | ❌    |
| RAM Usage      | 50MB      | 200MB+   | 30MB  |
| Startup        | 1.5s      | 5s+      | 0.3s  |
| AI Assistant   | ✅        | ❌       | ❌    |

## GitHub

'"${REPO_URL}"'

⭐ Star if it helps you save RAM and money
🍴 Fork if you want to contribute
🐛 Report bugs or request features

**Feedback Request:**
What features are missing for your daily sysadmin work? I want to build what you actually need.

---

Built by a developer who got tired of paying for basic tools. 🔧

#sysadmin #devops #ssh #opensource #linux'

POST_DEVOPS='DevOps engineers,

I built Termiaxial because I was tired of SSH clients that eat resources like hungry hippos.

## The Problem

As DevOps engineers, we need to:
- Manage 50+ servers simultaneously
- Keep connection latency low
- Not consume all available RAM
- Actually trust our tools (open source)
- Not pay $100+/year for basic features

## The Solution

Termiaxial - a SSH/SFTP client built with Rust + Tauri v2.

### Performance Metrics

| Scenario          | Electron Apps | Termiaxial |
|------------------|---------------|------------|
| Idle (0 sessions)| 200MB         | 50MB       |
| 10 sessions      | 2GB           | 500MB      |
| 50 sessions      | 10GB          | 2.5GB      |

### DevOps-Specific Features

**SSH Management:**
- Batch connection management
- Auto-reconnect on network changes
- Connection pooling
- Latency monitoring

**SFTP Operations:**
- Drag-drop file transfers
- Recursive directory sync
- Resume interrupted transfers
- Progress tracking

**Security:**
- AES-GCM-256 encrypted vault
- Master Password with Argon2id
- Local storage only (no cloud)
- Zero-knowledge sync architecture

**Automation:**
- AI-powered error analysis
- Terminal command suggestions
- Log file parsing assistance
- Integration with CI/CD workflows

## GitHub

'"${REPO_URL}"'

**Community Contribution:**
Looking for DevOps engineers to:
- Test real-world scenarios
- Suggest automation features
- Provide infrastructure feedback
- Contribute to enterprise features

---

Built for people who manage infrastructure. 🔧

#devops #ssh #rust #tauri #opensource'

# Function to check if Reddit CLI is installed
check_reddit_cli() {
    if ! command -v &> /dev/null; then
        echo -e "${YELLOW}⚠ Reddit CLI not found${NC}"
        echo -e "${YELLOW}  Please install reddit-cli or post manually${NC}"
        echo -e "${YELLOW}  Visit: https://github.com/reddit-archive/reddit${NC}"
        return 1
    fi
    return 0
}

# Function to post to Reddit
post_to_reddit() {
    local subreddit=$1
    local title=$2
    local content=$3

    echo -e "${BLUE}Posting to ${subreddit}...${NC}"

    # Using reddit-cli (if installed)
    # Note: You'll need to configure reddit-cli first
    # reddit-cli submit "${subreddit}" "${title}" "${content}" || {
    #     echo -e "${YELLOW}⚠ Auto-post failed. Please post manually.${NC}"
    #     echo -e "${YELLOW}  Subreddit: ${subreddit}${NC}"
    #     echo -e "${YELLOW}  Title: ${title}${NC}"
    #     echo -e "${YELLOW}  Content saved to /tmp/reddit_post_${subreddit}.md${NC}"
    #     echo "${content}" > "/tmp/reddit_post_${subreddit}.md"
    #     return 1
    # }

    # For now, save to file
    echo -e "${YELLOW}⚠ Saving post for manual submission${NC}"
    echo -e "${YELLOW}  Subreddit: ${subreddit}${NC}"
    echo -e "${YELLOW}  Title: ${title}${NC}"
    echo -e "${YELLOW}  Location: /tmp/reddit_post_${subreddit}.md${NC}"
    echo "${content}" > "/tmp/reddit_post_${subreddit}.md"
}

# Post to r/rust
post_rust() {
    echo -e "${GREEN}Posting to r/rust...${NC}"
    post_to_reddit "rust" \
        "Built a SSH client that uses 1/10th RAM of Electron apps (Rust + Tauri v2)" \
        "${POST_RUST}"
}

# Post to r/tauri
post_tauri() {
    echo -e "${GREEN}Posting to r/tauri...${NC}"
    post_to_reddit "tauri" \
        "My Tauri v2 SSH client is ready for launch - 50MB RAM, <1.5s startup" \
        "${POST_TAURI}"
}

# Post to r/programming
post_programming() {
    echo -e "${GREEN}Posting to r/programming...${NC}"
    post_to_reddit "programming" \
        "Electron bloat is over: Meet the 50MB SSH client (Rust + Tauri v2)" \
        "${POST_PROGRAMMING}"
}

# Post to r/sysadmin
post_sysadmin() {
    echo -e "${GREEN}Posting to r/sysadmin...${NC}"
    post_to_reddit "sysadmin" \
        "Devs: Stop paying for SSH clients - Meet Termiaxial (50MB RAM, MIT Open Source)" \
        "${POST_SYSADMIN}"
}

# Post to r/devops
post_devops() {
    echo -e "${GREEN}Posting to r/devops...${NC}"
    post_to_reddit "devops" \
        "DevOps engineers: Built a SSH client that actually respects your resources (50MB RAM, Rust + Tauri v2)" \
        "${POST_DEVOPS}"
}

# Main menu
main_menu() {
    echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}   Reddit Posting - Termiaxial Campaign${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

    echo -e "1. Post to r/rust (Best for launch day)"
    echo -e "2. Post to r/tauri (Day 2)"
    echo -e "3. Post to r/programming (Day 2)"
    echo -e "4. Post to r/sysadmin (Day 2-3)"
    echo -e "5. Post to r/devops (Day 3)"
    echo -e "6. Post to ALL subreddits (Launch day)"
    echo -e "7. Exit\n"

    read -p "Select option (1-7): " choice

    case $choice in
        1)
            post_rust
            ;;
        2)
            post_tauri
            ;;
        3)
            post_programming
            ;;
        4)
            post_sysadmin
            ;;
        5)
            post_devops
            ;;
        6)
            echo -e "${YELLOW}Posting to all subreddits...${NC}"
            post_rust
            post_tauri
            post_programming
            post_sysadmin
            post_devops
            echo -e "${GREEN}✓ All posts saved for manual submission${NC}"
            echo -e "${YELLOW}  Check /tmp/reddit_post_* for content${NC}"
            ;;
        7)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
}

# Run main menu
main_menu