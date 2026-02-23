#!/bin/sh

# Check for staged changes that might contain secrets
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

echo "🛡️  Sonic Guardian: Scanning for secrets..."

# Patterns to scan for
PATTERNS="sk-proj-|ghp_|AKIA|-----BEGIN PRIVATE KEY-----"

FAILED=0

for FILE in $STAGED_FILES; do
if [ "$FILE" = "scripts/protect-secrets.sh" ]; then
    continue
  fi

  # Skip non-text files
  if git grep -qI . "$FILE"; then
    for PATTERN in $PATTERNS; do
      if grep -q "$PATTERN" "$FILE"; then
        echo "❌ SECRET DETECTED in $FILE: Matches '$PATTERN'"
        FAILED=1
      fi
    done
  fi
done

if [ $FAILED -ne 0 ]; then
  echo "⚠️  COMMIT BLOCKED: Remove secrets before committing."
  exit 1
fi

echo "✅ No secrets found."
exit 0
