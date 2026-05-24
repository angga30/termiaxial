# Contributing to Termiaxial

Thank you for your interest in contributing to Termiaxial! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites
- Node.js 20+
- Rust 1.70+
- Tauri CLI
- Git

### Setup

1. Fork the repository
2. Clone your fork
   ```bash
   git clone https://github.com/YOUR_USERNAME/termiaxial.git
   cd termiaxial
   ```

3. Add upstream remote
   ```bash
   git remote add upstream https://github.com/angga30/termiaxial.git
   ```

4. Install dependencies
   ```bash
   npm install
   ```

5. Start development server
   ```bash
   npm run dev
   ```

## Branching Model

We use [GitFlow](https://github.com/angga30/termiaxial/blob/main/docs/BRANCHING.md) for release management.

- **`main`** - Production code
- **`develop`** - Integration branch
- **`feature/*`** - New features
- **`bugfix/*`** - Bug fixes
- **`hotfix/*`** - Critical production fixes

## Development Workflow

1. Create a feature branch from `develop`
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run linters and tests
   ```bash
   npm run validate
   ```

4. Commit with conventional commit format
   ```bash
   git commit -m "feat(ssh): add support for SOCKS5 proxy"
   ```

5. Push to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create Pull Request to `develop`

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Example
```
feat(ssh): add SOCKS5 proxy support

- Add SOCKS5 configuration to connection settings
- Support authentication for SOCKS5 proxies
- Add proxy status indicator

Closes #123
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Tests
- `chore` - Build process or tools
- `ci` - CI configuration
- `revert` - Reverts

## Code Style

### TypeScript/React
- Use TypeScript for all new code
- Follow existing code patterns
- Use functional components with hooks
- Format with Prettier (use `npm run format`)

### Rust
- Follow Rust style guide
- Use `cargo fmt` for formatting
- Run `cargo clippy` for lints

### General
- Keep functions small and focused
- Write self-documenting code
- Add comments for complex logic
- Use meaningful variable names

## Testing

### Run tests
```bash
# TypeScript type checking
npm run type-check

# Rust tests
cd src-tauri
cargo test

# Full validation
npm run validate
```

### Writing tests
- Add unit tests for new features
- Test edge cases
- Ensure tests pass before PR

## Pull Request Process

1. Ensure all CI checks pass
2. Update documentation if needed
3. Add tests for new functionality
4. Update CHANGELOG.md (if user-facing changes)
5. Request review from maintainers
6. Address review feedback

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work)
- [ ] Documentation update

## Testing
Describe testing done

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] Added tests
- [ ] All tests passing
- [ ] No linting errors
- [ ] Updated CHANGELOG.md
```

## Coding Standards

### Security
- Never commit secrets or API keys
- Use environment variables for configuration
- Follow security best practices
- Review changes for security implications

### Performance
- Optimize for speed and memory
- Avoid unnecessary re-renders
- Use efficient data structures
- Profile performance improvements

### Accessibility
- Ensure keyboard navigation works
- Use ARIA labels where needed
- Test with screen readers
- Follow WCAG guidelines

## Getting Help

- Check [documentation](https://github.com/angga30/termiaxial/tree/main/docs)
- Open an [issue](https://github.com/angga30/termiaxial/issues)
- Join [discussions](https://github.com/angga30/termiaxial/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in the project's contributors list.

Thank you for contributing! 🎉