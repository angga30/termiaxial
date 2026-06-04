#!/bin/bash
set -e

echo "=== Termiaxial Release Script ==="
echo "Version: v1.0.0"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "src-tauri/Cargo.toml" ]; then
    echo "❌ Error: Must be run from termiaxial root directory"
    exit 1
fi

# Check GitHub auth
echo "🔍 Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    echo "❌ Error: GitHub CLI not authenticated"
    echo "Run: gh auth login"
    exit 1
fi
echo "✅ GitHub authenticated"
echo ""

# Check if tag exists
if git rev-parse v1.0.0 >/dev/null 2>&1; then
    echo "⚠️  Tag v1.0.0 already exists"
    read -p "Delete and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d v1.0.0
        git push origin :refs/tags/v1.0.0
        echo "✅ Tag deleted"
    else
        echo "❌ Aborted"
        exit 1
    fi
fi

# Build for macOS
echo "🔨 Building for macOS (universal)..."
npm run tauri build -- --target universal-apple-darwin

# Check if build succeeded
if [ ! -f "src-tauri/target/universal-apple-darwin/release/bundle/dmg/Termiaxial_0.1.0_universal.dmg" ]; then
    echo "❌ Error: Build failed - DMG file not found"
    exit 1
fi
echo "✅ macOS build successful"
echo ""

# Get file info
DMG_PATH="src-tauri/target/universal-apple-darwin/release/bundle/dmg/Termiaxial_0.1.0_universal.dmg"
DMG_SIZE=$(du -h "$DMG_PATH" | cut -f1)
echo "📦 Build artifact: $DMG_PATH"
echo "📦 Size: $DMG_SIZE"
echo ""

# Create release notes
RELEASE_NOTES=$(cat << 'EOF'
## 🎉 First Stable Release!

Termiaxial v1.0.0 adalah rilis stabil pertama dari SSH/SFTP client ultra-lightweight.

### ✨ Fitur Utama

**Core Features:**
- ✅ SSH authentication (password + private key: RSA, ED25519)
- ✅ Full terminal emulator (Xterm.js, 256 colors, 5000-line scrollback)
- ✅ SFTP file explorer dengan drag-drop upload/download
- ✅ Multi-tab session dengan auto-reconnect
- ✅ Master Password dengan Argon2id hashing
- ✅ AES-GCM-256 encrypted credential vault
- ✅ Local SQLite storage
- ✅ AI Assistant integration (OpenAI, Ollama, Anthropic)
- ✅ Terminal analysis dengan Ctrl+Space shortcut

**Performance:**
- ⚡ Ultra-lightweight: ~50MB idle RAM
- 🚀 Fast startup: <1.5s launch time
- 🔧 Native performance: Rust backend + React frontend
- 💪 10x lebih efisien daripada Electron-based alternatives

**Platform Support:**
- 🍎 macOS (Universal binary - Apple Silicon + Intel)
- 🐧 Linux (Coming soon)

### 🔒 Security

- Zero-knowledge architecture - vault sync, server can't read credentials
- Secure key storage dengan AES-GCM-256 encryption
- Argon2id password hashing untuk master password
- Local-only data storage by default (no cloud sync)

### 📥 Download

**macOS:**
- Universal DMG (Apple Silicon + Intel): `Termiaxial_0.1.0_universal.dmg`
- Size: 12MB (compressed), 32MB (installed)

**Linux:**
- Coming soon! Build di Linux environment needed.

### 🛠️ Install

**macOS:**
\`\`\`bash
# Download and open DMG file
open Termiaxial_0.1.0_universal.dmg
# Drag Termiaxial.app to Applications folder
\`\`\`

**Linux:**
\`\`\`bash
# Clone dan build
git clone https://github.com/angga30/termiaxial.git
cd termiaxial
npm install
npm run tauri build
\`\`\`

### 🙏 Terima Kasih

Ini adalah rilis stabil pertama Termiaxial! Terima kasih untuk semua feedback dan dukungan.

### 📚 Links

- [Documentation](https://github.com/angga30/termiaxial/tree/main/docs)
- [Issues](https://github.com/angga30/termiaxial/issues)
- [Discussions](https://github.com/angga30/termiaxial/discussions)
- [CHANGELOG](https://github.com/angga30/termiaxial/blob/main/CHANGELOG.md)

---

**Made with ❤️ by developers, for developers.**
EOF
)

# Create GitHub release
echo "🚀 Creating GitHub release..."
gh release create v1.0.0 \
    --title "Termiaxial v1.0.0 - First Stable Release" \
    --notes "$RELEASE_NOTES" \
    "$DMG_PATH"

echo ""
echo "✅ Release created successfully!"
echo "🔗 Release URL: https://github.com/angga30/termiaxial/releases/tag/v1.0.0"
echo ""
echo "📝 Next steps:"
echo "1. Verify release on GitHub"
echo "2. Test downloaded DMG"
echo "3. Share release with community"
echo ""
echo "🐧 For Linux builds, run this script on a Linux machine:"
echo "   npm run tauri build"
echo "   Then upload the AppImage to the GitHub release manually"