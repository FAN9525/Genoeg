# Git Workflow Guide - Genoeg Gewerk

## Current Git Status ✅

Your project is already set up with Git version control:

- **Repository**: https://github.com/FAN9525/Genoeg
- **Branch**: `master`
- **Commits**: 4 total
- **Status**: Clean working tree, fully synced
- **Author**: FAN9525

## Repository Structure

```
Repository: FAN9525/Genoeg
├── master (main branch)
│   ├── Initial commit (5b0d6ee)
│   ├── Troubleshooting guide (1f57544)
│   ├── Admin panel (677d4f9)
│   └── Admin guide (168e93d) ← Current
└── origin (GitHub remote)
```

## Daily Git Workflow

### Making Changes

```bash
# 1. Check current status
git status

# 2. Make your code changes
# ... edit files ...

# 3. See what changed
git diff

# 4. Stage changes
git add .                    # Add all changes
git add <filename>           # Add specific file

# 5. Commit with message
git commit -m "Description of changes"

# 6. Push to GitHub
git push
```

### Quick Commands

```bash
# View commit history
git log --oneline

# See current branch
git branch

# Check remote
git remote -v

# Pull latest changes (if collaborating)
git pull

# Undo changes (before commit)
git checkout -- <filename>

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

## Branching Strategy

### Feature Development

When adding new features, use feature branches:

```bash
# Create and switch to new branch
git checkout -b feature/new-feature-name

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push branch to GitHub
git push -u origin feature/new-feature-name

# Switch back to master
git checkout master

# Merge feature (when ready)
git merge feature/new-feature-name

# Push merged changes
git push

# Delete feature branch (optional)
git branch -d feature/new-feature-name
git push origin --delete feature/new-feature-name
```

### Example Branch Names

```bash
feature/email-notifications      # New feature
fix/leave-balance-calculation    # Bug fix
hotfix/critical-security-issue   # Urgent fix
enhancement/ui-improvements      # Improvements
docs/update-readme              # Documentation
```

## Commit Message Best Practices

### Good Commit Messages

```bash
✅ git commit -m "Add user role management feature"
✅ git commit -m "Fix leave balance calculation bug"
✅ git commit -m "Update README with deployment instructions"
✅ git commit -m "Refactor admin service for better performance"
✅ git commit -m "Add unit tests for leave service"
```

### Bad Commit Messages

```bash
❌ git commit -m "update"
❌ git commit -m "fixes"
❌ git commit -m "stuff"
❌ git commit -m "asdf"
```

### Commit Message Template

```
<type>: <short summary>

<optional detailed description>

<optional footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples**:
```bash
git commit -m "feat: Add admin dashboard with system statistics"
git commit -m "fix: Resolve prorated leave calculation error"
git commit -m "docs: Update admin guide with role descriptions"
git commit -m "refactor: Extract leave service into smaller modules"
```

## Common Scenarios

### Scenario 1: Adding a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/email-notifications

# 2. Develop feature
# ... code changes ...

# 3. Commit changes
git add .
git commit -m "feat: Add email notifications for leave approvals"

# 4. Push to GitHub
git push -u origin feature/email-notifications

# 5. Create Pull Request on GitHub (optional)
# Or merge directly:
git checkout master
git merge feature/email-notifications
git push
```

### Scenario 2: Fixing a Bug

```bash
# 1. Create fix branch
git checkout -b fix/balance-update

# 2. Fix the bug
# ... fix code ...

# 3. Commit fix
git add .
git commit -m "fix: Correct leave balance update after approval"

# 4. Push and merge
git push -u origin fix/balance-update
git checkout master
git merge fix/balance-update
git push
```

### Scenario 3: Daily Development

```bash
# Morning: Pull latest changes
git pull

# During day: Make changes and commit frequently
git add .
git commit -m "feat: Add department filter to user management"

# End of day: Push to GitHub
git push
```

### Scenario 4: Undo Mistakes

```bash
# Undo unstaged changes to a file
git checkout -- <filename>

# Undo all unstaged changes
git checkout -- .

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) ⚠️ DANGEROUS
git reset --hard HEAD~1

# Revert a specific commit (creates new commit)
git revert <commit-hash>
```

## .gitignore File

Your project already has a `.gitignore` that excludes:

```
✅ node_modules/          # Dependencies
✅ .next/                # Build output
✅ .env.local            # Environment secrets
✅ .DS_Store             # Mac files
✅ *.log                 # Log files
```

### Never Commit These

❌ `.env.local` - Contains sensitive keys
❌ `node_modules/` - Large, can be reinstalled
❌ `.next/` - Build artifacts
❌ Database credentials
❌ API keys
❌ Passwords

## GitHub Integration

### Viewing Repository

Visit: **https://github.com/FAN9525/Genoeg**

### Clone to Another Computer

```bash
git clone https://github.com/FAN9525/Genoeg.git
cd Genoeg
npm install
```

### Collaborating

If adding collaborators:

1. Go to GitHub → Settings → Collaborators
2. Add collaborator by username
3. They can then clone and push to repo

### Pull Requests (Optional)

For code review workflow:

1. Create feature branch
2. Push to GitHub
3. Open Pull Request on GitHub
4. Review and discuss
5. Merge when approved

## Git Aliases (Optional)

Add shortcuts to `.gitconfig`:

```bash
# Set up aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'

# Use them
git st           # Instead of: git status
git co master    # Instead of: git checkout master
git br           # Instead of: git branch
```

## Project History

Your current commits:

```
168e93d - Add comprehensive admin guide documentation
677d4f9 - Add admin panel with user management
1f57544 - Add troubleshooting guide and database fixes
5b0d6ee - Initial commit: Genoeg Gewerk leave management system
```

Total files tracked: **74 files**
Total lines of code: **14,176+ lines**

## Backup Strategy

Your code is safe because:

✅ Committed to local Git
✅ Pushed to GitHub (cloud backup)
✅ GitHub provides redundancy

### Additional Backup (Optional)

```bash
# Clone to external drive
git clone https://github.com/FAN9525/Genoeg.git /path/to/backup

# Or create archive
git archive --format=zip --output=genoeg-backup.zip master
```

## Troubleshooting

### "Your branch is ahead of origin"

You have local commits not pushed:
```bash
git push
```

### "Your branch is behind origin"

Remote has changes you don't have:
```bash
git pull
```

### "Merge conflict"

When two changes conflict:
```bash
# 1. Open conflicted files
# 2. Look for <<<<<<< markers
# 3. Manually resolve
# 4. Stage resolved files
git add <filename>
# 5. Complete merge
git commit
```

### "Detached HEAD state"

You checked out a commit:
```bash
git checkout master  # Return to branch
```

### "Permission denied"

GitHub authentication issue:
```bash
# Use HTTPS (current setup) or configure SSH
# HTTPS prompts for credentials
```

## Git Best Practices

### DO ✅

- Commit frequently (small, logical changes)
- Write clear commit messages
- Pull before pushing
- Review changes before committing
- Keep commits focused (one feature/fix per commit)
- Use branches for features
- Push regularly to backup

### DON'T ❌

- Commit sensitive data (.env files)
- Use vague commit messages
- Commit directly to master (in team settings)
- Force push to shared branches
- Commit broken code
- Include build artifacts
- Commit large binary files

## Quick Reference

### Status & Info
```bash
git status              # Working tree status
git log                 # Commit history
git log --oneline       # Compact history
git diff                # Unstaged changes
git diff --staged       # Staged changes
git branch              # List branches
git remote -v           # Show remotes
```

### Basic Workflow
```bash
git add .               # Stage all changes
git add <file>          # Stage specific file
git commit -m "msg"     # Commit with message
git push                # Push to remote
git pull                # Pull from remote
```

### Branching
```bash
git branch <name>       # Create branch
git checkout <name>     # Switch branch
git checkout -b <name>  # Create and switch
git merge <branch>      # Merge branch
git branch -d <name>    # Delete branch
```

### Undo
```bash
git checkout -- <file>  # Undo unstaged changes
git reset HEAD <file>   # Unstage file
git reset --soft HEAD~1 # Undo commit, keep changes
git revert <commit>     # Revert commit safely
```

## Resources

- **GitHub Repository**: https://github.com/FAN9525/Genoeg
- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com
- **Interactive Git Tutorial**: https://learngitbranching.js.org

---

## Your Git is Ready! 🎉

Everything is configured and working:

- ✅ Repository initialized
- ✅ 4 commits made
- ✅ GitHub remote configured
- ✅ Code backed up to cloud
- ✅ .gitignore protecting secrets
- ✅ Clean working tree

**Start developing with confidence!**




