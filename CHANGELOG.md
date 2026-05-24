# Changelog

All notable changes to Termiaxial will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-05-25

### Added
- Initial release of Termiaxial - Ultra-lightweight SSH/SFTP client
- SSH authentication with password and private key support (RSA, ED25519)
- Full terminal emulator with Xterm.js (256 colors, 5000-line scrollback)
- SFTP file explorer with drag-drop upload/download capabilities
- Multi-tab session management with auto-reconnect
- Master Password protection with Argon2id hashing
- AES-GCM-256 encrypted credential vault
- Local SQLite storage for secure credential management
- AI Assistant integration (OpenAI, Ollama, Anthropic)
- Terminal analysis with Ctrl+Space shortcut
- Responsive UI with React + TypeScript + Tailwind CSS
- Native performance with Rust backend (Tauri v2)
- Cross-platform support (macOS, Linux)

### Security
- Zero-knowledge architecture - vault sync, server can't read credentials
- Secure key storage with AES-GCM-256 encryption
- Argon2id password hashing for master password
- Local-only data storage by default (no cloud sync)

### Performance
- Ultra-lightweight: ~50MB idle RAM usage
- Fast startup: <1.5s launch time
- Native performance: Rust backend + React frontend
- 10x more efficient than Electron-based alternatives

### Documentation
- Comprehensive README with installation instructions
- MVP2 Roadmap outlining future features
- Contributing guidelines and code of conduct
- MIT License

---

## Unreleased

### Planned Features
- SSH Tunneling (Local/Remote/SOCKS5)
- Snippet Manager with fuzzy search
- Session Recording (Asciinema format)
- AI Autocomplete for commands
- Cloud Sync for credential vault

---

## Versioning

Termiaxial follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

## Download

Latest releases are available at: https://github.com/angga30/termiaxial/releases