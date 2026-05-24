# GitFlow Branching Model

This project uses GitFlow branching model for release management.

## Branches

### Main Branches
- **`main`** - Production-ready code. Always reflects the latest stable release.
- **`develop`** - Integration branch for features. All features merge into develop.

### Supporting Branches
- **`feature/*`** - New features (e.g., `feature/ssh-tunneling`)
- **`bugfix/*`** - Bug fixes (e.g., `bugfix/memory-leak`)
- **`hotfix/*`** - Critical production fixes (e.g., `hotfix/security-patch`)
- **`release/*`** - Release preparation (e.g., `release/v1.1.0`)

## Workflow

### Feature Development
1. Create feature branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit with conventional commits
   ```bash
   git commit -m "feat(ssh): add support for SOCKS5 proxy"
   ```

3. Push and create PR to `develop`
   ```bash
   git push origin feature/your-feature-name
   ```

4. CI runs automatically on PR (lint, test, build)

5. Merge PR to `develop` after approval

### Bug Fixes
1. Create bugfix branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b bugfix/your-bugfix-name
   ```

2. Fix and commit
   ```bash
   git commit -m "fix(vault): resolve memory leak in credential manager"
   ```

3. Push and create PR to `develop`

### Hotfixes (Production)
1. Create hotfix branch from `main`
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/your-hotfix-name
   ```

2. Fix and commit
   ```bash
   git commit -m "hotfix(security): patch critical vulnerability"
   ```

3. Push and create PR to both `main` and `develop`

### Releases
1. Create release branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.1.0
   ```

2. Update version numbers:
   - `package.json` version
   - `src-tauri/Cargo.toml` version
   - `CHANGELOG.md`

3. Commit and push
   ```bash
   git commit -m "release(v1.1.0): bump version and update changelog"
   git push origin release/v1.1.0
   ```

4. Create PR to `main` for final approval

5. After merge to `main`, create Git tag:
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin v1.1.0
   ```

6. GitHub Actions automatically builds release binaries and creates GitHub release

7. Merge `release/*` back to `develop` (if not already merged)

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style changes (formatting, etc)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Build process or auxiliary tool changes
- `ci` - CI configuration changes
- `build` - Build system or external dependencies
- `revert` - Reverts a previous commit
- `release` - Release-related changes

### Scopes
- `ssh` - SSH-related changes
- `sftp` - SFTP-related changes
- `vault` - Credential vault changes
- `ai` - AI assistant changes
- `ui` - UI/UX changes
- `terminal` - Terminal emulator changes
- `security` - Security-related changes
- `auth` - Authentication changes
- `crypto` - Cryptography changes
- `database` - Database changes
- `build` - Build system changes
- `ci` - CI/CD changes
- `deps` - Dependency updates
- `config` - Configuration changes
- `docs` - Documentation changes
- `release` - Release-related changes

## CI/CD

- **Lint & Test**: Runs on all branches and PRs
- **Build**: Runs on all branches and PRs
- **PR Check**: Validates PR size, labels, description
- **Release**: Triggered by version tags (v*)

## Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

Example: `v1.2.3`
- 1 = Major version
- 2 = Minor version
- 3 = Patch version