# Sonic Guardian

Private Bitcoin recovery using acoustic commitments and zero-knowledge proofs on Starknet.

## 🎯 Overview

Sonic Guardian enables **privacy-preserving recovery** for Bitcoin multisig wallets using memorable acoustic DNA. It combines zero-knowledge proofs (Pedersen commitments) with acoustic synthesis to create a recovery mechanism that's both secure and memorable.

**Problem**: Traditional Bitcoin recovery relies on seed phrases that can be stolen, lost, or phished.

**Solution**: Acoustic DNA derived from musical vibes, committed to Starknet using zero-knowledge proofs, serving as a guardian key for Bitcoin multisig recovery.

## 🚀 Features

### Core Functionality
- **Acoustic DNA Generation**: Deterministic secrets from musical vibes via AI synthesis
- **Pedersen Commitments**: True zero-knowledge proofs hiding DNA on-chain
- **Bitcoin Integration**: Multisig recovery via sBTC/tBTC bridge
- **Privacy-Preserving**: No credential exposure during recovery

### Security
- **Zero-Knowledge Proofs**: Pedersen commitments hide DNA cryptographically
- **Client-Side Cryptography**: All secrets generated and stored locally
- **Venice AI**: Privacy-focused inference without logging
- **Static Build**: No backend, no data collection

### User Experience
- **Memorable Recovery**: Sound is easier to remember than 24 words
- **Real-Time Synthesis**: Hear your acoustic DNA as it's generated
- **Mobile Responsive**: Full functionality on all devices
- **Theme Support**: Light, dark, and system themes

## 🏗️ Architecture

```
sonicguardian/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── agent/         # AI synthesis endpoints
│   │   │   └── dna/           # DNA extraction endpoints
│   │   └── page.tsx           # Main application
│   ├── components/            # React components
│   │   ├── SonicGuardian.tsx  # Main UI
│   │   ├── WalletButton.tsx   # Starknet wallet
│   │   └── StarknetProvider.tsx
│   ├── lib/                   # Core libraries
│   │   ├── dna.ts            # DNA extraction & hashing
│   │   ├── ai-agent.ts       # Venice AI integration
│   │   ├── audio.ts          # Strudel synthesis
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
│   │   └── audio.ts         # Audio generation
│   ├── __tests__/           # Test suite
│   │   ├── dna.test.ts      # DNA extraction tests
│   │   ├── ai-agent.test.ts # AI agent tests
│   │   ├── storage.test.ts  # Storage tests
│   │   └── integration.test.ts # Integration tests
│   └── styles/              # Global styles
├── package.json
└── README.md
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

### Acoustic DNA Extraction

The DNA extraction process ensures deterministic, reproducible secrets:

1. **AI Synthesis**: Venice AI translates vibe → Strudel pattern code
2. **AST Parsing**: Extract musical features from code structure
3. **Normalization**: Sort and deduplicate features for consistency
4. **Hashing**: Generate deterministic hash from normalized features

Example:
```typescript
Vibe: "dark industrial techno"
↓
Code: stack(s("bd*4").bank("RolandTR909").distort(3), s("hh*8").gain(0.6))
↓
Features: ["stack", "s", "bank", "distort", "gain"]
↓
DNA: "bank(RolandTR909)|distort(3)|gain(0.6)|s(bd*4)|s(hh*8)|stack"
↓
Hash: sha256(DNA + salt)
```

### Zero-Knowledge Commitments

Pedersen commitments provide cryptographic hiding:

```typescript
// Registration
blinding = crypto.randomUUID()
commitment = pedersen_hash(dna_hash, blinding)
contract.register_guardian(btc_address, commitment)

// Recovery
user_provides(dna_hash, blinding)
computed = pedersen_hash(dna_hash, blinding)
if (computed == stored_commitment) {
  authorize_recovery()
}
```

The commitment reveals nothing about the DNA, yet proves knowledge during recovery.

### Bitcoin Integration

Recovery flow via sBTC/tBTC bridge:

1. User loses hot wallet key
2. Provides acoustic DNA + hardware wallet signature
3. Starknet verifies Pedersen commitment
4. Contract authorizes sBTC/tBTC transaction
5. Bitcoin multisig executes recovery

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