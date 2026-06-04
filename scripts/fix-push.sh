#!/bin/bash
set -e

echo "=== Termiaxial GitHub Push Helper ==="
echo ""
echo "🔍 Current Status:"
echo ""

# Show current branch
BRANCH=$(git branch --show-current)
echo "📌 Current branch: $BRANCH"

# Show remote
REMOTE=$(git remote get-url origin)
echo "🔗 Remote URL: $REMOTE"

# Show ahead/behind status
AHEAD=$(git rev-list --count origin/$BRANCH..$BRANCH 2>/dev/null || echo "0")
echo "📊 Commits ahead of origin: $AHEAD"

# Show untracked files
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')
echo "📁 Untracked files: $UNTRACKED"

echo ""
echo "🔐 SSH Key Setup:"
echo ""

# Check SSH keys
echo "Available SSH keys:"
ls -1 ~/.ssh/*.pub 2>/dev/null | sed 's|/Users/[^/]*/.ssh/||' | sed 's/.pub//'

echo ""
echo "Checking GitHub SSH access..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    SSH_USER=$(ssh -T git@github.com 2>&1 | head -1 | sed 's/Hi \(.*\)!/\1/')
    echo "✅ SSH key authenticated as: $SSH_USER"
else
    echo "❌ SSH key not working"
fi

echo ""
echo "🔑 Solution Options:"
echo ""
echo "Option 1: Use angga30 SSH key"
echo "  git remote set-url origin git@github-angga30:angga30/termiaxial.git"
echo "  git push origin develop"
echo ""
echo "Option 2: Add angga30 key to ssh-agent"
echo "  eval \$(ssh-agent -s)"
echo "  ssh-add ~/.ssh/id_ed25519_angga"
echo "  git push origin develop"
echo ""
echo "Option 3: Create deploy key for repository"
echo "  1. Go to: https://github.com/angga30/termiaxial/settings/keys"
echo "  2. Add deploy key: ~/.ssh/id_ed25519_angga.pub"
echo "  3. git push origin develop"
echo ""
echo "Option 4: Use HTTPS with workflow-scope token"
echo "  git remote set-url origin https://<TOKEN>@github.com/angga30/termiaxial.git"
echo "  git push origin develop"
echo ""

# What will be pushed
if [ "$AHEAD" -gt 0 ] || [ "$UNTRACKED" -gt 0 ]; then
    echo "📤 What will be pushed:"
    if [ "$AHEAD" -gt 0 ]; then
        echo "  Commits:"
        git log origin/$BRANCH..$BRANCH --oneline 2>/dev/null || echo "    (new branch)"
    fi
    if [ "$UNTRACKED" -gt 0 ]; then
        echo "  Untracked files:"
        git ls-files --others --exclude-standard | sed 's/^/    /'
    fi
    echo ""
fi

echo "💡 Quick Fix (Recommended):"
echo ""
echo "1. Add the angga30 key to repository as deploy key:"
echo "   cat ~/.ssh/id_ed25519_angga.pub"
echo "   # Copy the key and add at: https://github.com/angga30/termiaxial/settings/keys"
echo ""
echo "2. OR update remote to use the angga30 key:"
echo "   git remote set-url origin git@github-angga30:angga30/termiaxial.git"
echo "   git push origin develop"
echo ""
echo "3. OR use the id_gh_angga30 key:"
echo "   git remote set-url origin git@github.com:angga30/termiaxial.git"
echo "   ssh-keygen -t ed25519 -f ~/.ssh/id_gh_angga30 -C 'angga30@github.com'"
echo "   # Add ~/.ssh/id_gh_angga30.pub to https://github.com/angga30/termiaxial/settings/keys"
echo "   git push origin develop"
echo ""
echo "✨ After fixing auth, workflows will run automatically!"