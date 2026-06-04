#!/bin/bash
set -e

echo "=== GitFlow & GitHub Actions Setup ==="
echo ""
echo "This script will help you complete the setup of GitFlow and GitHub Actions"
echo ""

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "⚠️  Warning: Not on develop branch"
    read -p "Switch to develop? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout develop
    fi
fi

echo ""
echo "📋 Summary of changes committed:"
git log -1 --stat

echo ""
echo "🔐 GitHub Authentication Issue"
echo "Your GitHub token doesn't have 'workflow' scope needed to push workflow files."
echo ""
echo "To fix this, you need to:"
echo "1. Go to https://github.com/settings/tokens"
echo "2. Create a new Personal Access Token with scopes: gist, read:org, repo, workflow"
echo "3. Update your git credentials:"
echo ""
echo "   git config --local credential.helper store"
echo "   git push origin develop"
echo ""
echo "   Then enter your new token when prompted."
echo ""
echo "Alternatively, use GitHub CLI:"
echo ""
echo "   gh auth login"
echo "   # Select: GitHub.com, HTTPS, Login with a web browser"
echo "   # Authorize with workflow scope"
echo "   git push origin develop"
echo ""

# Show what files will be pushed
echo "📁 Files to be pushed:"
git diff --name-only origin/develop...HEAD

echo ""
echo "🔄 Next Steps:"
echo "1. Fix authentication (see above)"
echo "2. Push to develop: git push origin develop"
echo "3. Create PR from develop to main: gh pr create --base main"
echo "4. Merge PR to main"
echo "5. Create release tag: git tag -a v1.1.0 -m 'Release v1.1.0'"
echo "6. Push tag: git push origin v1.1.0"
echo "7. GitHub Actions will automatically build and create release"
echo ""
echo "📚 Documentation:"
echo "- Branching model: docs/BRANCHING.md"
echo "- Contributing guide: CONTRIBUTING.md"
echo ""
echo "✨ Workflows created:"
echo "- .github/workflows/lint.yml - Linting (TypeScript, Rust, Prettier)"
echo "- .github/workflows/build.yml - Build & Test (multi-platform)"
echo "- .github/workflows/release.yml - Release automation (multi-platform builds)"
echo "- .github/workflows/pr-check.yml - PR validation"
echo ""
echo "🎉 Setup complete! Follow the steps above to complete the process."