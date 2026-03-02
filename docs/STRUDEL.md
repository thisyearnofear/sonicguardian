# Strudel Integration

Sonic Guardian uses **Strudel** to generate musical patterns from user vibes. This document explains our integration.

---

## Overview

**Strudel** is a web-based live coding environment for music, porting TidalCycles to JavaScript. We use it to:

1. Generate musical patterns from text prompts
2. Encode 256-bit entropy into memorable chunks
3. Extract deterministic DNA hashes for ZK commitments

---

## Pattern Explorer

Our **Pattern Explorer** showcases **16+ interactive demos** of Strudel features:

### Access
Click **"🎓 Explore 16+ Strudel Features"** in the app.

### Features Showcased

#### Rhythm (5 demos)
- **Basic Rhythms**: `s("bd*4")` - Repeat 4 times
- **Syncopation**: `s("bd[~ ~]")` - Off-beat patterns
- **Nested Patterns**: `s("bd[sd ~]")` - Patterns within patterns
- **Polyrhythms**: `stack(s("bd*3").slow(3), s("sd*4").slow(4))`
- **Euclidean**: `s("bd[~ ~][~ ~]")` - Mathematically distributed

#### Harmony (4 demos)
- **Scales**: `n("c4 d4 e4").scale("C:major")`
- **Chord Progressions**: `n("I V vi IV").scale("C:major")`
- **Jazz Harmony**: `n("ii V I").scale("D:minor")`
- **Arpeggios**: `n("c3 e3 g3").pattern("<c3 g3 e3>")`

#### Transformations (4 demos)
- **Time Stretch**: `.slow(4)`, `.fast(2)`
- **Rotation**: `s("<bd*4 bd[~ bd]>")`
- **Probability**: `n("c4?0.5 d4?0.5")`
- **Conditional**: `.sometimes(<>)`

#### Effects (4 demos)
- **Filter Automation**: `.lpf(<400 800 1200>)`
- **Distortion**: `.distort(2.5)`
- **Reverb**: `.room(0.8)`
- **Bitcrush**: `.crush(8)`

---

## Pattern Library

We maintain **20+ curated patterns** in `src/lib/strudel.ts`:

### Categories
- **Rhythm & Percussion** (4 patterns)
- **Bass & Low End** (3 patterns)
- **Melodic & Harmonic** (5 patterns)
- **Ambient & Textural** (3 patterns)
- **Complex & Layered** (5 patterns)

### Example Patterns

#### Techno (Full Arrangement)
```javascript
stack(
  s("bd*4").bank("RolandTR909").gain(1.2),
  s("~ sd ~ sd").bank("RolandTR909").distort(0.3),
  s("hh*16").gain(0.35).lpf(8000),
  note("c2 ~ f2 ~").s("sawtooth").lpf(400).distort(1.5)
).cpm(132)
```

#### Ambient Drift
```javascript
stack(
  note("c2").s("sine").slow(8).room(0.95),
  note("g2").s("triangle").slow(8).room(0.9),
  note("c3").s("sawtooth").slow(4).lpf(400)
).cpm(60)
```

#### Lo-Fi Hip Hop
```javascript
stack(
  s("bd ~ [bd ~]").bank("RolandTR808").crush(8),
  s("~ sd ~ ~").bank("RolandTR808").crush(8),
  n("I vi IV V").scale("F:major").sound("piano").slow(4)
).cpm(85)
```

---

## Pattern Generation

### Secure Pattern Generator

Located: `src/lib/pattern-generator.ts`

```typescript
import { generateSecurePattern, mutatePattern } from '../lib/pattern-generator';

// Generate pattern with complexity level
const pattern = generateSecurePattern('complex');
// Returns: { code, chunks, description, category, entropy }

// Mutate existing pattern (remix)
const remixed = mutatePattern(pattern.code, 'moderate');
```

### Features
- **Mini Notation**: Full Strudel syntax support
- **Scales & Modes**: 10 scales (major, minor, dorian, etc.)
- **Chord Qualities**: 7 types (major, minor, 7th, etc.)
- **Chord Progressions**: 7 common progressions
- **Effects**: 12 effects with parameter ranges
- **Entropy**: 128-256 bits (AES-128/256 equivalent)

---

## DNA Extraction

Located: `src/lib/dna.ts`

### Process
1. **Parse Strudel AST** - Extract musical features
2. **Normalize** - Sort and deduplicate (order-independent)
3. **Hash** - SHA-256 of normalized features
4. **Commit** - Pedersen hash for Starknet

### Example
```typescript
import { extractSonicDNA } from '../lib/dna';

const dna = await extractSonicDNA(code, { captureSemantics: true });
// Returns: { dna, features, hash, salt, rhythmicFeatures, harmonicFeatures, temporalFeatures }
```

### Features Captured
- **Rhythmic**: Drum patterns, timing, banks
- **Harmonic**: Scales, chords, notes
- **Temporal**: `slow()`, `fast()`, tempo
- **Effects**: Filters, distortion, reverb

---

## Mini Notation Reference

### Basic Syntax
| Pattern | Meaning | Example |
|---------|---------|---------|
| `*4` | Repeat 4 times | `bd*4` |
| `[~ x]` | Rest then hit | `bd[~ sd]` |
| `<x y>` | Rotate between | `<bd sd>` |
| `x?0.5` | 50% chance | `bd?0.5` |
| `/3` | Triplets | `[c3 e3 g3]/3` |
| `sometimes` | Random apply | `sometimes(<>))` |

### Advanced
| Pattern | Meaning | Example |
|---------|---------|---------|
| `[x [x x]]` | Nested patterns | `bd[sd [hh oh]]` |
| `x y, z` | Polyrhythmic | `bd sd, hh*8` |
| `!` | Accent | `bd!` |
| `@n` | Play every nth time | `bd@3` |

---

## Visualizer

Located: `src/components/StrudelVisualizer.tsx`

### Features
- **Canvas-based** - Real-time frequency display
- **Color-coded** - Notes mapped to hue spectrum
- **Active hap tracking** - Shows currently playing events
- **Reusable** - Used in Pattern Explorer and GiftApp

### Usage
```tsx
import { StrudelVisualizer } from './StrudelVisualizer';

<StrudelVisualizer 
  isActive={isPlaying}
  getActiveHaps={() => activeHaps}
  height={120}
/>
```

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/strudel.ts` | Core Strudel utilities, pattern library |
| `src/lib/pattern-generator.ts` | Cryptographic pattern generation |
| `src/lib/dna.ts` | DNA extraction from patterns |
| `src/components/StrudelEditor.tsx` | Live code editor with visualizer |
| `src/components/StrudelVisualizer.tsx` | Reusable visualizer component |
| `src/components/PatternExplorer.tsx` | Interactive feature showcase |

---

## Resources

- **[Strudel Docs](https://strudel.cc/)** - Official documentation
- **[TidalCycles](https://tidalcycles.org/)** - Original pattern language
- **[Mini Notation](https://strudel.cc/learn/)** - Pattern syntax reference

---

**Last Updated:** March 2, 2026
