#!/bin/bash

# Sonic Guardian Sample Downloader
# Fetches essential drum samples for offline reliability

BASE_URL="https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master"
SAMPLES_DIR="public/samples"

fetch_sample() {
  local bank=$1
  local name=$2
  local file="${name}.wav"
  
  mkdir -p "${SAMPLES_DIR}/${bank}"
  if [ ! -f "${SAMPLES_DIR}/${bank}/${file}" ]; then
    echo "📥 Fetching ${bank}/${file}..."
    curl -s -L "${BASE_URL}/${bank}/${file}" -o "${SAMPLES_DIR}/${bank}/${file}"
  else
    echo "✅ ${bank}/${file} already exists."
  fi
}

# Essential Kits
banks=("808" "909" "707" "bd" "sd" "hh" "oh" "hc")

for bank in "${banks[@]}"; do
  # Fetch first 4 variations of each
  for i in {0..3}; do
    fetch_sample "$bank" "$i"
  done
done

echo "🏁 Samples ready in ${SAMPLES_DIR}"
