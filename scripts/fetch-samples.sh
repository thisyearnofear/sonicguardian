#!/bin/bash

# Sonic Guardian Sample Downloader
# Fetches essential drum samples from tidalcycles/Dirt-Samples via GitHub API

GITHUB_API="https://api.github.com/repos/tidalcycles/Dirt-Samples/contents"
BASE_URL="https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master"
SAMPLES_DIR="public/samples"

# Banks to download (essential drum kits)
# Note: 707 doesn't exist in Dirt-Samples, use 808 or 909 instead
# oh = open hats - use 'ho' instead (ho exists, oh doesn't)
banks=("808" "909" "bd" "sd" "hh" "ho" "hc")

fetch_bank_samples() {
  local bank=$1
  
  echo "🎵 Processing bank: ${bank}"
  
  # Create bank directory
  mkdir -p "${SAMPLES_DIR}/${bank}"
  
  # Fetch file list from GitHub API
  local api_response
  api_response=$(curl -s "${GITHUB_API}/${bank}")
  
  # Check for API error
  if echo "$api_response" | grep -q '"message"'; then
    echo "⚠️  Error fetching ${bank}: $(echo "$api_response" | grep -o '"message"[^,]*' | head -1)"
    return 1
  fi
  
  # Extract .wav filenames from JSON response
  local files
  files=$(echo "$api_response" | grep -o '"name"[^,]*' | grep -i '\.wav"' | sed 's/"name": "//;s/"$//')
  
  if [ -z "$files" ]; then
    echo "⚠️  No .wav files found in ${bank}"
    return 1
  fi
  
  # Download each file
  local count=0
  while IFS= read -r file; do
    local target="${SAMPLES_DIR}/${bank}/${file}"
    
    # Check if file exists and has content (not a 404 stub)
    if [ -f "$target" ] && [ -s "$target" ] && [ $(stat -f%z "$target" 2>/dev/null || stat -c%s "$target" 2>/dev/null) -gt 1000 ]; then
      echo "  ✅ ${file} already exists"
    else
      echo "  📥 Downloading ${bank}/${file}..."
      curl -s -L "${BASE_URL}/${bank}/${file}" -o "$target"
      
      # Verify download
      local size=$(stat -f%z "$target" 2>/dev/null || stat -c%s "$target" 2>/dev/null)
      if [ "$size" -lt 1000 ]; then
        echo "  ⚠️  Download may have failed (size: ${size} bytes)"
      fi
    fi
    
    ((count++))
  done <<< "$files"
  
  echo "  📦 ${count} samples processed for ${bank}"
}

# Clean up old incorrectly-named files
cleanup_old_files() {
  echo "🧹 Cleaning up old placeholder files..."
  for bank in "${banks[@]}"; do
    for i in {0..3}; do
      local old_file="${SAMPLES_DIR}/${bank}/${i}.wav"
      if [ -f "$old_file" ]; then
        local size=$(stat -f%z "$old_file" 2>/dev/null || stat -c%s "$old_file" 2>/dev/null)
        if [ "$size" -lt 100 ]; then
          rm -f "$old_file"
          echo "  🗑️  Removed placeholder: ${bank}/${i}.wav"
        fi
      fi
    done
  done
}

# Main execution
echo "🥁 Sonic Guardian Sample Downloader"
echo "===================================="

cleanup_old_files

for bank in "${banks[@]}"; do
  fetch_bank_samples "$bank"
done

echo ""
echo "🏁 Samples ready in ${SAMPLES_DIR}"
echo "💡 Run 'ls -la public/samples/*/' to verify"