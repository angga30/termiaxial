#!/bin/bash

# Termiaxial Campaign Automation Script
# Automates multi-platform posting and engagement

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="angga30"
REPO_NAME="termiaxial"
GITHUB_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}"
CAMPAIGN_DIR="$(pwd)/campaign"
TEMPLATES_DIR="${CAMPAIGN_DIR}/templates"

# Check if repository is public
check_repo_public() {
    echo -e "${BLUE}Checking repository visibility...${NC}"
    local visibility=$(gh repo view ${REPO_OWNER}/${REPO_NAME} --json visibility -q .visibility 2>/dev/null || echo "error")

    if [ "$visibility" == "PUBLIC" ]; then
        echo -e "${GREEN}✓ Repository is PUBLIC${NC}"
        return 0
    else
        echo -e "${RED}✗ Repository is PRIVATE${NC}"
        echo -e "${YELLOW}⚠ Repository must be PUBLIC to launch campaign${NC}"
        echo -e "${YELLOW}  Run: gh repo edit ${REPO_OWNER}/${REPO_NAME} --visibility public${NC}"
        return 1
    fi
}

# GitHub Actions status check
check_github_actions() {
    echo -e "${BLUE}Checking GitHub Actions status...${NC}"
    gh run list --repo ${REPO_OWNER}/${REPO_NAME} --limit 5 || {
        echo -e "${YELLOW}⚠ No GitHub Actions runs found${NC}"
        echo -e "${YELLOW}  Actions will run automatically after repository is PUBLIC${NC}"
    }
}

# Get repository statistics
get_repo_stats() {
    echo -e "${BLUE}Fetching repository statistics...${NC}"
    gh repo view ${REPO_OWNER}/${REPO_NAME} --json stargazers,forks,issues,watchers --template \
        'Stars: {{.stargazers}} | Forks: {{.forks}} | Issues: {{.issues}} | Watchers: {{.watchers}}'
}

# Create launch checklist
create_launch_checklist() {
    echo -e "${BLUE}Creating launch checklist...${NC}"

    cat > "${CAMPAIGN_DIR}/LAUNCH_CHECKLIST.md" << EOF
# 🚀 Termiaxial Launch Checklist

## Pre-Launch (Day 1)

- [ ] Repository is PUBLIC
- [ ] GitHub Actions running successfully
- [ ] All CI/CD pipelines passing
- [ ] Documentation complete
- [ ] Screenshots captured
- [ ] Demo video recorded
- [ ] Social media accounts ready

## Launch Day (Day 2)

- [ ] GitHub repository PUBLIC
- [ ] Tweet launch announcement
- [ ] LinkedIn post
- [ ] Reddit posts (r/rust, r/tauri, r/programming)
- [ ] HackerNews post
- [ ] Discord announcements
- [ ] Email friends/colleagues

## Follow-up (Day 3-7)

- [ ] Reply to all comments
- [ ] Monitor GitHub issues
- [ ] Review pull requests
- [ ] Track analytics
- [ ] Share progress updates

## Metrics to Track

- [ ] GitHub stars
- [ ] GitHub forks
- [ ] GitHub issues
- [ ] Contributors
- [ ] Downloads
- [ ] Social media engagement

## Platforms

### GitHub
- [ ] Repository public
- [ ] Topics/tags added
- [ ] Labels configured
- [ ] Branch protection enabled
- [ ] Discussions enabled

### Social Media
- [ ] Twitter/X post
- [ ] LinkedIn post
- [ ] Reddit posts (5+ communities)
- [ ] HackerNews post
- [ ] Discord announcements (3+ servers)

### Content
- [ ] Blog posts written
- [ ] Demo video created
- [ ] Screenshots captured
- [ ] Performance benchmarks documented
- [ ] Roadmap updated

---

Created: $(date)
Status: Ready to launch
EOF

    echo -e "${GREEN}✓ Launch checklist created${NC}"
    echo -e "${YELLOW}  Location: ${CAMPAIGN_DIR}/LAUNCH_CHECKLIST.md${NC}"
}

# Prepare social media content
prepare_content() {
    echo -e "${BLUE}Preparing social media content...${NC}"

    # Create content calendar
    cat > "${CAMPAIGN_DIR}/CONTENT_CALENDAR.md" << EOF
# 📅 Termiaxial Content Calendar

## Week 2: Launch Week (Maximum Impact)

### Monday (Day 1)
- **GitHub**: Repository goes PUBLIC
- **Twitter**: Launch announcement thread
- **LinkedIn**: Professional announcement
- **Email**: Friends and colleagues

### Tuesday (Day 2)
- **Reddit**: r/rust post
- **Reddit**: r/tauri post
- **Reddit**: r/programming post
- **Twitter**: Reddit cross-promo

### Wednesday (Day 3)
- **HackerNews**: Show HN post
- **Twitter**: HackerNews shoutout
- **Discord**: Tauri Discord announcement
- **Discord**: Rust Discord announcement

### Thursday (Day 4)
- **Reddit**: r/sysadmin post
- **Reddit**: r/devops post
- **Discord**: DevOps communities
- **LinkedIn**: Technical deep-dive

### Friday (Day 5)
- **Dev.to**: Technical blog post
- **Hashnode**: Performance analysis
- **Twitter**: Weekend demo offer
- **GitHub**: Weekly progress update

## Week 3: Sustenance

### Daily
- Reply to GitHub issues
- Engage on social media
- Monitor Reddit comments

### Weekly
- Monday: Weekly update post
- Wednesday: Feature highlight
- Friday: Community shoutout

## Week 4-6: Content Wave

### Content Types
- 3 Technical blog posts (Dev.to/Hashnode)
- 2 Demo videos (YouTube)
- 2 Reddit feature posts
- 4 LinkedIn posts
- Daily Twitter engagement

## Week 7-9: Community Building

- Contributor spotlights
- Feature showcases
- Q&A sessions
- Community highlights

## Week 10-12: Scale & Optimize

- Cross-promotion
- Partnership opportunities
- Feature announcements
- Year-end recap

---

Total Planned Content:
- Reddit posts: 10
- Twitter posts: 30
- LinkedIn posts: 15
- Blog posts: 5
- Videos: 3
- Discord announcements: 10
EOF

    echo -e "${GREEN}✓ Content calendar created${NC}"
    echo -e "${YELLOW}  Location: ${CAMPAIGN_DIR}/CONTENT_CALENDAR.md${NC}"
}

# Generate platform-specific posts
generate_posts() {
    echo -e "${BLUE}Generating platform-specific posts...${NC}"

    # Create posts directory
    mkdir -p "${CAMPAIGN_DIR}/posts"

    # Copy templates to posts directory
    cp "${TEMPLATES_DIR}/TWITTER_TEMPLATES.md" "${CAMPAIGN_DIR}/posts/twitter.md"
    cp "${TEMPLATES_DIR}/REDDIT_TEMPLATES.md" "${CAMPAIGN_DIR}/posts/reddit.md"
    cp "${TEMPLATES_DIR}/HACKERNEWS_TEMPLATES.md" "${CAMPAIGN_DIR}/posts/hackernews.md"
    cp "${TEMPLATES_DIR}/LINKEDIN_TEMPLATES.md" "${CAMPAIGN_DIR}/posts/linkedin.md"
    cp "${TEMPLATES_DIR}/DISCORD_TEMPLATES.md" "${CAMPAIGN_DIR}/posts/discord.md"

    echo -e "${GREEN}✓ Platform posts generated${NC}"
    echo -e "${YELLOW}  Location: ${CAMPAIGN_DIR}/posts/${NC}"
}

# Create tracking spreadsheet
create_tracking_sheet() {
    echo -e "${BLUE}Creating tracking spreadsheet...${NC}"

    cat > "${CAMPAIGN_DIR}/TRACKING.md" << EOF
# 📊 Termiaxial Campaign Tracking

## GitHub Metrics

| Date | Stars | Forks | Issues | Contributors | Downloads |
|------|-------|-------|--------|--------------|-----------|
| Day 0 | 0 | 0 | 0 | 0 | 0 |
| Day 1 | | | | | |
| Day 7 | | | | | |
| Day 30 | | | | | |

## Social Media Metrics

### Twitter/X
| Date | Post | Likes | Retweets | Replies | Views |
|------|------|-------|----------|---------|-------|
| Day 1 | Launch | | | | |
| Day 2 | Reddit | | | | |
| Day 3 | HN | | | | |

### Reddit
| Subreddit | Upvotes | Comments | Award | GitHub Clicks |
|-----------|---------|-----------|-------|---------------|
| r/rust | | | | |
| r/tauri | | | | |
| r/programming | | | | |
| r/sysadmin | | | | |
| r/devops | | | | |

### HackerNews
| Date | Upvotes | Comments | Rank | GitHub Clicks |
|------|---------|-----------|------|---------------|
| Day 3 | | | | |

### LinkedIn
| Date | Post | Likes | Comments | Shares | Views |
|------|------|-------|----------|--------|-------|
| Day 1 | Launch | | | | |
| Day 4 | Deep-dive | | | | |

## Engagement Tracking

### Community Members
| Platform | Followers/Members | Growth |
|----------|-------------------|--------|
| GitHub Stars | | |
| Discord | | |
| Twitter | | |
| LinkedIn | | |

### Contributor Onboarding
| Week | New Contributors | PRs Merged | Issues Closed |
|------|-----------------|------------|--------------|
| Week 1 | | | |
| Week 2 | | | |
| Week 3 | | | |
| Week 4 | | | |

## Content Performance

### Blog Posts
| Title | Platform | Views | Shares | GitHub Clicks |
|-------|----------|-------|--------|---------------|
| Post 1 | Dev.to | | | |
| Post 2 | Hashnode | | | |

### Videos
| Title | Platform | Views | Likes | GitHub Clicks |
|-------|----------|-------|-------|---------------|
| Demo 1 | YouTube | | | |

## Goals vs Actual

### Month 1 Goals
| Metric | Goal | Actual | Status |
|--------|------|--------|--------|
| Stars | 100 | | |
| Forks | 10 | | |
| Contributors | 5 | | |
| Downloads | 500 | | |
| Social Views | 5,000 | | |

### Month 2 Goals
| Metric | Goal | Actual | Status |
|--------|------|--------|--------|
| Stars | 250 | | |
| Forks | 25 | | |
| Contributors | 10 | | |
| Downloads | 1,000 | | |

### Month 3 Goals
| Metric | Goal | Actual | Status |
|--------|------|--------|--------|
| Stars | 500 | | |
| Forks | 50 | | |
| Contributors | 20 | | |
| Downloads | 2,000 | | |

---

Last Updated: $(date)
Next Update: Tomorrow
EOF

    echo -e "${GREEN}✓ Tracking sheet created${NC}"
    echo -e "${YELLOW}  Location: ${CAMPAIGN_DIR}/TRACKING.md${NC}"
}

# Monitor GitHub repository
monitor_github() {
    echo -e "${BLUE}Monitoring GitHub repository...${NC}"

    # Get current stats
    echo -e "${GREEN}Current Statistics:${NC}"
    get_repo_stats

    # Get recent activity
    echo -e "\n${GREEN}Recent Activity:${NC}"
    gh repo view ${REPO_OWNER}/${REPO_NAME} --json pushedAt,updatedAt --template \
        'Last Push: {{.pushedAt}} | Last Update: {{.updatedAt}}'

    # Get recent issues
    echo -e "\n${GREEN}Recent Issues:${NC}"
    gh issue list --repo ${REPO_OWNER}/${REPO_NAME} --limit 5 || echo "No issues yet"

    # Get recent pull requests
    echo -e "\n${GREEN}Recent Pull Requests:${NC}"
    gh pr list --repo ${REPO_OWNER}/${REPO_NAME} --limit 5 || echo "No PRs yet"
}

# Main menu
main_menu() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}   Termiaxial Campaign Automation${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

    echo -e "1. Check Repository Status"
    echo -e "2. Create Launch Checklist"
    echo -e "3. Prepare Content Calendar"
    echo -e "4. Generate Platform Posts"
    echo -e "5. Create Tracking Sheet"
    echo -e "6. Monitor GitHub"
    echo -e "7. Full Setup (All of above)"
    echo -e "8. Exit\n"

    read -p "Select option (1-8): " choice

    case $choice in
        1)
            check_repo_public
            check_github_actions
            get_repo_stats
            ;;
        2)
            create_launch_checklist
            ;;
        3)
            prepare_content
            ;;
        4)
            generate_posts
            ;;
        5)
            create_tracking_sheet
            ;;
        6)
            monitor_github
            ;;
        7)
            echo -e "${YELLOW}Running full setup...${NC}\n"
            check_repo_public || exit 1
            check_github_actions
            get_repo_stats
            create_launch_checklist
            prepare_content
            generate_posts
            create_tracking_sheet
            echo -e "\n${GREEN}✓ Full setup complete!${NC}"
            echo -e "${YELLOW}  All campaign materials ready in ${CAMPAIGN_DIR}/${NC}"
            ;;
        8)
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