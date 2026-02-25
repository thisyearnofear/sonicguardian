# Bitcoin Birthday Cards: Product & UX Design

Bitcoin Birthday Cards transform the technical act of sending BTC into an emotional, musical experience. Powered by **Sonic Guardian** (Privacy) and **Starkzap** (UX), it removes all "excuses" for not giving Bitcoin.

## 🎨 Product Vision

The goal is to create a gifting experience that feels like a physical greeting card:
1. **The Vibe**: The sender "records" or generates a musical vibe (The Sonic DNA).
2. **The Gift**: BTC is attached to this vibe.
3. **The Reveal**: The recipient enters the vibe to unlock the Bitcoin.

## 🛠️ System Architecture

### 1. Gifting Flow (Sender)
- **Vibe Generation**: Sender uses the Sonic Guardian interface to generate a 256-bit musical seed phrase.
- **DNA Extraction**: The system extracts the Acoustic DNA hash.
- **Vault Creation**: Using **Starkzap**, the sender creates a "Gift Vault" on-chain.
- **Locking**: The vault is locked using a Pedersen commitment of the DNA hash.
- **Card Generation**: A digital card (or printable PDF) is generated containing the musical chunks (e.g., "909 kicks on 1 and 3...").

### 2. Claiming Flow (Recipient)
- **Landing**: Recipient visits `sonicguardian.io/gift`.
- **Social Onboarding**: Recipient logs in via **Starkzap Social Login** (Google/Apple). A Starknet/Bitcoin wallet is instantly created for them in the background.
- **The "Vibe" Input**: Recipient enters the musical chunks from the card.
- **Verification**: 
  - System reconstructs the pattern.
  - Extracts DNA hash.
  - Computes Pedersen hash with stored blinding factor (if provided) or uses the chunks as a direct key.
- **The Reveal**: If the DNA matches, the gift is unlocked.
- **Settlement**: Starkzap moves the BTC from the vault to the recipient's new wallet.

## 🎭 UI/UX Principles

### For Senders: "Compose the Gift"
- **Low Friction**: Don't force them to understand ZK-proofs. It's just "picking a song".
- **Visual Feedback**: Real-time visualizers for the Sonic DNA.
- **Personalization**: Ability to add a text message to the card.

### For Recipients: "Hear the Magic"
- **Magical Moment**: When the chunks are entered, the music starts playing. 
- **The "Aha!"**: The realization that the *music* is the key.
- **No Seed Phrases**: They never see 24 words. Their identity is their Google account + the music they were gifted.

## 🤖 Agent Experience (Venice AI)

AI agents can assist in both ends:
- **Sender Agent**: "I want a funky birthday vibe for my friend who loves techno." → Agent generates the Strudel code.
- **Recipient Agent**: "I have these musical chunks, what do I do?" → Agent explains the "vibe recovery" concept.

## 🔒 Security & Privacy

- **ZK-Gifting**: The sender doesn't know the recipient's address yet. The gift is "floating" on-chain, locked by the DNA.
- **Pedersen Privacy**: Even if the gift vault is public, the "vibe" (seed phrase) is never exposed on-chain.
- **Self-Custody**: The recipient has full control via Starkzap's smart account.
