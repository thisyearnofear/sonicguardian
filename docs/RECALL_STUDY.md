# M1 — Human Recall Study Protocol

**Purpose:** measure whether non-musicians can recall a generated musical
pattern after a week, and — more importantly — *how* they misremember. The
error distribution is the input that parameterizes the fuzzy extractor (M2);
its tolerance is a measurement result, not a guess.

**Success criterion:** the study is done when we can state, with confidence
intervals, the per-dimension recall error rates for n ≥ 50 participants and
translate them into a fuzzy-extractor tolerance proposal.

## Design summary

- **Design:** within-subjects, 2 conditions × 1 week
  - **Condition A — chunk-encoded random pattern** (the current `random` mode: 5 written chunks)
  - **Condition B — listen-only pattern** (no written chunks; pure audio memory)
- **n:** ≥ 50 (target 60 to absorb dropout; expect ~20–30% attrition at 1 week)
- **Population:** non-musicians (self-report: cannot read music, no ≥1 year of instrument/vocal training)
- **Primary endpoints:** exact-recall rate, per-dimension error rate, error magnitude distribution

## Materials (Day 0)

Generate per participant with the existing chunk encoder
(`src/lib/entropy-encoder.ts` `encodePattern` on fresh CSPRNG entropy), rendered
via Strudel in the browser. Export per participant:

1. `materials/<participant_id>/pattern.strudel` — the generated code
2. `materials/<participant_id>/chunks.txt` — the 5 written chunks (Condition A only)
3. `materials/<participant_id>/day0-audio.webm` — Day-0 recording of the pattern
4. `materials/<participant_id>/manifest.json` — entropy seed hash (salted), condition, timestamps

Keep a server-side (or researcher-local) map of seed → pattern; participants
never handle raw entropy.

## Procedure

**Day 0 (~15 min)**
1. Consent form (data use, withdrawal, no compensation claims; IRB-lite ethics statement below)
2. Background questionnaire (musical experience, age bracket, native language, whether they hum/sing regularly)
3. Training: listen to the pattern ≥ 5 times; Condition A additionally writes the 5 chunks by hand
4. Self-test: reproduce/re-enter chunks; record confidence (1–5)
5. Schedule Day-7 session; **no access to materials in between** (no copies home — this must be enforced and logged)

**Day 7 (~15 min)**
1. Free recall: Condition A re-enters their chunks from memory; Condition B hums/sings or selects on a melodic-dimension questionnaire
2. Recognition probe: identify the correct pattern among 5 distractors (measures whether memory is there even if recall fails)
3. Confidence rating again
4. Debrief: which dimensions did they find hardest to remember? (free text)

## Error annotation taxonomy

Every Day-7 attempt is scored against the Day-0 pattern **per musical
dimension** — this granularity is what the fuzzy extractor needs:

| Dimension | Error type | Encoded as |
|-----------|-----------|------------|
| Rhythm | added note / dropped note / shifted note / swapped subgroup | `R+`, `R-`, `R>`, `R~` + step index |
| Melody | wrong pitch, ±semitones | `P±k` + token index |
| Melody | right pitch, wrong octave | `O±k` + token index |
| Sound/synth | wrong instrument category | `S` + observed vs expected |
| Effects | wrong filter/gain/distort bucket | `E<dimension>` + bucket delta |
| Tempo | BPM delta | `T±bpm` |
| Chunks (A) | whole chunk dropped / order swapped | `C-drop`, `C-swap` |

Ground truth for scoring: script `scripts/score-recall.mjs` (to be added with
the scoring harness) diffs attempt vs. Day-0 pattern and emits
`results/<participant_id>.json` in this schema:

```json
{
  "participant_id": "P042",
  "condition": "A",
  "exact_recall": false,
  "dimension_errors": { "rhythm": 2, "pitch": 1, "pitch_semitone_delta": [-2], "sound": 0, "tempo_bpm_delta": 0 },
  "recognition_correct": true,
  "confidence_day0": 4,
  "confidence_day7": 3
}
```

## Analysis plan (pre-registered before data collection)

1. **Exact-recall rate** per condition with 95% Wilson CI. This is the headline number.
2. **Per-dimension error distribution** — empirical CDF of |error| per dimension. The fuzzy extractor tolerance per dimension = the 95th-percentile error magnitude.
3. **Recognition vs recall gap** — if recognition ≫ recall, recognition-based recovery UX (multiple-choice re-authentication) deserves investigation as an intermediate design.
4. **Predictors** of recall success (condition, chunks written, confidence, musical background) via logistic regression.
5. **Output:** `docs/RECALL_STUDY_RESULTS.md` + a proposed fuzzy-extractor tolerance vector (per-dimension bits that must be discarded/erasure-coded), feeding M2.

> **Note on the chunk-decode channel (added during harness testing):** a
> roundtrip through `decodeChunks` (chunk text → entropy → pattern) is lossy —
> a single-word chunk substitution propagated into 3 rhythm errors, extra
> pitch deltas, and an ~11 BPM drift. Two implications: (a) score chunk-based
> attempts against the *chunks text* as ground truth too, not just the decoded
> code, and (b) the decode channel's noise floor must be characterized before
> M2, or fuzzy-extractor tolerances will absorb codec error rather than human
> error.

## Ethics

- Informed consent; participation voluntary; withdraw anytime with data deletion
- No collection of biometric recordings beyond optional humming attempts (deleted after annotation)
- No real funds or keys involved; patterns generated for the study are never registered on-chain
- Data stored pseudonymously (participant IDs only)

## Cost & timeline

- Build materials generator + scoring harness: ~2–3 days of work
- Recruitment (friends-of-friends, local communities, no paid panel needed): 1 week
- Day 0 → Day 7 window: 1 week
- Annotation (2 independent raters, disagreements adjudicated): ~3 days
- **Total: ~4 weeks, near-zero cash cost.** Cheapest and most informative step in the roadmap.

## Status

- [x] Materials generator (`scripts/generate-study-materials.mjs`) — seeded/deterministic, condition A/B, writes `pattern.strudel` + `chunks.txt` + salted `manifest.json`
- [x] Scoring harness (`scripts/score-recall.mjs`) — per-dimension error scoring (rhythm, pitch ±semitones, octave, synth, tempo), accepts chunk re-entry (decoded via `decodeChunks`) or raw Strudel code; output matches the results schema below
- [ ] Consent form + questionnaires drafted
- [ ] n=60 recruited
- [ ] Data collected
- [ ] Results published (`docs/RECALL_STUDY_RESULTS.md`) with fuzzy-extractor tolerance proposal → unblocks M2

**Usage:**

```bash
# Day 0 — per participant (seeded = reproducible; raw seed is never stored)
node scripts/generate-study-materials.mjs P001 A --seed 42

# Day 7 — score the attempt (chunks file or Strudel code)
node scripts/score-recall.mjs study/materials/P001 attempt.txt -o study/results/P001.json
```

Participant data lives in `study/`, which is gitignored — it must never be committed.
