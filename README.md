# Sonic Guardian

Private Bitcoin recovery using musical seed phrases and zero-knowledge proofs on Starknet.

## 🎯 Overview

Sonic Guardian enables **privacy-preserving recovery** for Bitcoin multisig wallets using memorable musical seed phrases. It combines zero-knowledge proofs (Pedersen commitments) with deterministic audio synthesis to create a recovery mechanism that's both cryptographically secure and memorable.

**Problem**: Traditional Bitcoin recovery relies on 24-word seed phrases that are hard to remember and easy to lose.

**Solution**: Musical seed phrases (5-7 chunks like "909 kicks on 1 and 3, distort by 2.5") with 256-bit entropy, committed to Starknet using zero-knowledge proofs, serving as a guardian key for Bitcoin multisig recovery.

## 🚀 Features

### Core Functionality
- **Musical Seed Phrases**: 256-bit entropy encoded as 5-7 memorable musical chunks
- **Deterministic Synthesis**: Same chunks always produce same Strudel pattern
- **Pedersen Commitments**: True zero-knowledge proofs hiding DNA on-chain
- **Bitcoin Integration**: Multisig recovery via sBTC/tBTC bridge
- **Auditory Verification**: Verify recovery by listening to your pattern

### Security
- **256-bit Entropy**: Equivalent to AES-256, using crypto.getRandomValues()
- **Zero-Knowledge Proofs**: Pedersen commitments hide DNA cryptographically
- **Client-Side Cryptography**: All secrets generated and stored locally
- **Deterministic Encoding**: Entropy → Strudel pattern mapping is bijective
- **Static Build**: No backend, no data collection

### User Experience
- **Memorable Recovery**: Musical chunks easier to remember than 24 random words
- **Real-Time Synthesis**: Hear your guardian key as it's generated
- **Copy & Export**: Save chunks to password manager or encrypted storage
- **Mobile Responsive**: Full functionality on all devices
- **Theme Support**: Light, dark, and system themes

## 🏗️ Architecture

```
sonicguardian/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── agent/         # AI synthesis endpoints (optional)
│   │   │   └── dna/           # DNA extraction endpoints
│   │   └── page.tsx           # Main application
│   ├── components/            # React components
│   │   ├── SonicGuardian.tsx  # Main UI
│   │   ├── WalletButton.tsx   # Starknet wallet
│   │   └── StarknetProvider.tsx
│   ├── lib/                   # Core libraries
│   │   ├── entropy-encoder.ts # 256-bit → Strudel encoding
│   │   ├── dna.ts            # DNA extraction & hashing
│   │   ├── crypto.ts         # Pedersen commitments
│   │   ├── strudel.ts        # Audio synthesis
│   │   ├── storage.ts        # Secure local storage
│   │   └── visualizer.ts     # DNA visualization
│   └── hooks/
│       └── use-starknet-guardian.ts  # Contract interaction
├── contracts/
│   ├── src/
│   │   └── lib.cairo         # Pedersen commitment contract
│   └── scripts/
│       ├── deploy.js         # Deployment automation
│       └── setup-account.sh  # Account setup helper
└── docs/
    ├── STARKNET.md           # Technical architecture
    ├── PRIVACY.md            # Cryptographic analysis
    └── SKILL.md              # AI agent interface
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and pnpm
- Starknet wallet (Argent or Braavos)
- Venice AI API key (for synthesis)

### Quick Start

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd sonicguardian
   pnpm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   VENICE_API_KEY=your_venice_api_key
   NEXT_PUBLIC_USE_REAL_AI=true
   NEXT_PUBLIC_AI_PROVIDER=venice
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

3. **Start development**
   ```bash
   pnpm dev
   ```
   
   Open `http://localhost:3000`

## 🔗 Deploy Starknet Contract

### Install Cairo Tools

```bash
# Install Scarb (Cairo package manager)
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh

# Install Starkli (deployment tool)
curl https://get.starkli.sh | sh
starkliup
```

### Setup Starknet Account

```bash
# Interactive setup helper
pnpm contracts:setup

# Or manual setup:
starkli signer keystore new ~/.starkli-wallets/deployer/keystore.json
# Get testnet ETH: https://starknet-faucet.vercel.app/
starkli account fetch <YOUR_ADDRESS> --output ~/.starkli-wallets/deployer/account.json
```

### Deploy Contract

```bash
# Export environment variables
export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json
export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json
export STARKNET_NETWORK=sepolia

# Deploy
pnpm contracts:deploy
```

The script automatically updates `.env.local` with the contract address.

See [contracts/README.md](contracts/README.md) for detailed deployment documentation.

## 🎯 Usage

### Setup Bitcoin Guardian

1. **Connect Wallet**: Click "Connect Argent" or "Connect Braavos"
2. **Create Acoustic DNA**: 
   - Choose a sound from the library or describe your vibe
   - Click "Mint Sonic DNA"
   - Listen to your unique acoustic signature
3. **Anchor to Starknet**:
   - Click "Anchor to Starknet (ZK-Privacy)"
   - Approve transaction in wallet
   - Your Pedersen commitment is stored on-chain

### Recover Bitcoin Wallet

1. **Enter Recovery Mode**: Click "Switch Protocol ⇄"
2. **Provide Acoustic DNA**: Enter the same vibe used during setup
3. **Verify Identity**: Click "Verify Identity"
4. **Authorize Recovery**: If verified, authorize Bitcoin transaction

## 🔐 Security Model

### What's Private
- ✅ Acoustic DNA hash (hidden via Pedersen commitment)
- ✅ Original vibe description (one-way extraction)
- ✅ Blinding factor (client-side only)
- ✅ Failed recovery attempts (verified locally)

### What's Public
- ⚠️ Pedersen commitment (reveals nothing cryptographically)
- ⚠️ Bitcoin address being guarded (necessary for recovery)
- ⚠️ Successful recovery events (required for authorization)

### Threat Model
- **Protects Against**: Phishing, seed phrase theft, social engineering
- **Requires**: User remembers their vibe (or stores it securely)
- **Assumes**: Starknet security, Pedersen commitment soundness

## 🏆 Hackathon Alignment

### Privacy Track ($9,675)
- ✅ **Pedersen Commitments**: Real zero-knowledge primitive
- ✅ **Anonymous Credentials**: Prove ownership without identity
- ✅ **Private Recovery**: No credential exposure on-chain
- ✅ **Confidential Transactions**: Hidden recovery flow

### Bitcoin Track ($5,000)
- ✅ **BTC-Native Use Case**: Multisig recovery mechanism
- ✅ **Privacy Enhancement**: No seed phrase exposure
- ✅ **Starknet Integration**: sBTC/tBTC bridge
- ✅ **Real-World Utility**: Solves lost key problem

## 🛡️ Security Best Practices

### For Users
- Store your vibe securely (password manager or encrypted note)
- Test recovery flow before relying on it
- Use hardware wallet for primary Bitcoin keys
- Keep blinding factor backup (exported from app)

### For Developers
- Never log vibes or DNA hashes
- Validate all inputs before commitment
- Use secure random for blinding factors
- Audit contract before mainnet deployment

## 🎨 Technical Details

### Musical Seed Phrase Generation

The system encodes 256 bits of cryptographic entropy into memorable musical chunks:

**Step 1: Generate Entropy**
```typescript
const entropy = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
```

**Step 2: Encode to Strudel Pattern**
```typescript
const encoded = encodePattern(entropy);
// Maps bits deterministically:
// Bits 0-63:   Drum patterns (kick, snare, timing, bank)
// Bits 64-127: Melodic content (notes, synth, octaves)
// Bits 128-191: Effects chain (distort, filter, gain)
// Bits 192-255: Structure (tempo, layers)
```

**Step 3: Generate Musical Chunks**
```typescript
// Example output:
[
  "909 kicks on 1 and 3",           // 12 bits
  "distort by 2.5",                 // 4 bits
  "sawtooth bass C#3 F3 Bb2 Eb3",  // 30 bits
  "lowpass filter at 1200 hertz",   // 5 bits
  "gain 0.8",                       // 4 bits
  "808 snare on 2 and 4",           // 12 bits
  "tempo 128"                       // 8 bits
]
// Total: 256 bits entropy
```

**Step 4: User Saves Chunks**
- Copy to password manager
- Write down securely
- Memorize (easier than 24 random words)

### Recovery Flow

**User provides chunks → System reconstructs pattern → Extracts DNA → Verifies ZK proof**

```typescript
// 1. User inputs chunks
const chunks = [
  "909 kicks on 1 and 3",
  "distort by 2.5",
  // ... etc
];

// 2. Reconstruct Strudel pattern
const pattern = reconstructFromChunks(chunks);

// 3. Extract DNA hash
const dna = await extractSonicDNA(pattern);

// 4. Verify Pedersen commitment
const isValid = await verifyRecovery(btcAddress, dna.hash, blinding);

// 5. If valid, authorize Bitcoin recovery
if (isValid) {
  await authorizeBtcRecovery(btcAddress, dna.hash, blinding);
}
```

### Zero-Knowledge Commitments

Pedersen commitments provide cryptographic hiding:

```typescript
// Registration
blinding = crypto.randomUUID()
commitment = pedersen_hash(dna_hash, blinding)
contract.register_guardian(btc_address, commitment)

// Recovery
user_provides(chunks)
pattern = reconstruct(chunks)
dna_hash = extract(pattern)
computed = pedersen_hash(dna_hash, blinding)
if (computed == stored_commitment) {
  authorize_recovery()
}
```

The commitment reveals nothing about the DNA, yet proves knowledge during recovery.

### Bitcoin Integration

Recovery flow via sBTC/tBTC bridge:

1. User loses hot wallet key
2. Provides musical chunks + hardware wallet signature
3. System reconstructs pattern and extracts DNA
4. Starknet verifies Pedersen commitment
5. Contract authorizes sBTC/tBTC transaction
6. Bitcoin multisig executes recovery

### Comparison to BIP39

| Aspect | BIP39 Seed Phrases | Sonic Guardian |
|--------|-------------------|----------------|
| **Format** | 24 random words | 5-7 musical chunks |
| **Example** | "witch collapse pride..." | "909 kicks on 1 and 3..." |
| **Entropy** | 256 bits | 256 bits |
| **Memorability** | Abstract word list | Musical structure |
| **Verification** | Checksum only | Play sound + checksum |
| **Mental Model** | None | Music production workflow |
| **Recovery** | Type 24 words | Input 5-7 chunks |

**Key Advantage**: Musical chunks leverage auditory memory and semantic structure, making them easier to remember than random words while maintaining equivalent cryptographic security.

## 📚 API Reference

### Generate Strudel Pattern
```typescript
POST /api/agent/generate
Body: { prompt: string }
Response: { 
  code: string,
  provider: "venice" | "mock",
  confidence: number
}
```

### Extract Acoustic DNA
```typescript
POST /api/dna/extract
Body: { code: string }
Response: {
  hash: string,
  features: string[],
  dna: string,
  salt: string
}
```

### Contract Interface
```cairo
trait ISonicGuardian {
  fn register_guardian(
    btc_address: felt252,
    commitment: felt252,
    blinding_commitment: felt252
  );
  
  fn verify_recovery(
    btc_address: felt252,
    dna_hash: felt252,
    blinding: felt252
  ) -> bool;
  
  fn authorize_btc_recovery(
    btc_address: felt252,
    proof: RecoveryProof
  ) -> felt252;
}
```

## 🧪 Development

### Project Structure
```
src/
├── lib/
│   ├── dna.ts           # Core DNA extraction logic
│   ├── ai-agent.ts      # Venice AI integration
│   ├── audio.ts         # Strudel synthesis
│   ├── storage.ts       # Secure local storage
│   └── visualizer.ts    # DNA visualization
├── components/
│   ├── SonicGuardian.tsx      # Main UI component
│   ├── WalletButton.tsx       # Starknet wallet connection
│   └── StarknetProvider.tsx   # Web3 provider
└── hooks/
    └── use-starknet-guardian.ts  # Contract interaction
```

### Core Principles
- **Enhancement First**: Improve existing code before adding new features
- **Consolidation**: Delete unnecessary code, no deprecation
- **DRY**: Single source of truth for shared logic
- **Modular**: Composable, testable, independent modules
- **Performant**: Adaptive loading, caching, optimization

### Available Scripts
```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

pnpm contracts:build  # Build Cairo contracts
pnpm contracts:deploy # Deploy to Starknet
pnpm contracts:setup  # Setup Starknet account
```

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the core principles above
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Starknet Foundation**: For the hackathon and privacy infrastructure
- **Venice AI**: For privacy-preserving inference
- **Strudel**: For the live coding synthesis engine
- **sBTC/tBTC**: For Bitcoin ↔ Starknet bridge

## 📞 Support

- Documentation: See `docs/` directory
- Issues: GitHub Issues
- Hackathon: PL Genesis & Starknet Re{define}

---

**Sonic Guardian** - Private Bitcoin recovery through acoustic commitments. 🎵🔐