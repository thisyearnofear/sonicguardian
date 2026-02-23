# Sonic Guardian - Enhanced Next.js Implementation

A modern, production-ready implementation of the Sonic Guardian acoustic DNA identity system, built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Acoustic DNA Extraction**: Deterministic hash generation from Strudel live coding patterns
- **Zero-Knowledge Recovery**: Prove identity knowledge without revealing the secret
- **Deterministic Generation**: Same prompt always produces same DNA hash
- **Web Audio API**: Real-time audio feedback and sound generation

### Enhanced Security
- **Cryptographic Hashing**: SHA-256 with salt and timestamp
- **Input Validation**: Comprehensive validation with rate limiting
- **Secure Storage**: Encrypted localStorage with error handling
- **Session Management**: Secure session tracking with recovery history

### Modern Architecture
- **Next.js 16.1.6**: Server-side rendering and API routes
- **TypeScript**: Full type safety and better development experience
- **Tailwind CSS**: Utility-first styling with theme support
- **React Hooks**: Modern state management with hooks

### Enhanced User Experience
- **Theme Support**: Light, dark, and system theme options
- **Audio Controls**: Toggle audio and animations
- **Real AI Integration**: Google Gemini API for code generation
- **Loading States**: Smooth transitions and feedback
- **Mobile Responsive**: Works on all devices

## 🏗️ Architecture

```
sonicguardian-next/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── agent/         # AI agent endpoints
│   │   │   └── dna/           # DNA extraction endpoints
│   │   └── page.tsx           # Main application page
│   ├── components/            # React components
│   │   ├── EnhancedSonicGuardian.tsx  # Main UI component
│   │   └── ...
│   ├── lib/                   # Core libraries
│   │   ├── dna.ts            # DNA extraction logic
│   │   ├── ai-agent.ts       # AI agent integration
│   │   ├── storage.ts        # State management
│   │   ├── theme.ts          # Theme system
│   │   ├── api.ts           # API utilities
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

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sonicguardian-next
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   VENICE_API_KEY=your_venice_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_USE_REAL_AI=true
   NEXT_PUBLIC_AI_PROVIDER=venice
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Visit `http://localhost:3000`

## 🔗 Starknet Contract Deployment

### Prerequisites

1. **Install Scarb (Cairo Package Manager)**
   ```bash
   # Using curl (recommended)
   curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
   
   # Or using Homebrew (macOS)
   brew install scarb
   
   # Or using asdf
   asdf plugin add scarb && asdf install scarb latest
   ```

2. **Install Starkli (Deployment Tool)**
   ```bash
   curl https://get.starkli.sh | sh
   starkliup
   ```

3. **Set up Starknet Account**
   ```bash
   # Create a new keystore
   starkli signer keystore new ~/.starkli-wallets/deployer/keystore.json
   
   # Get testnet ETH from: https://starknet-faucet.vercel.app/
   
   # Fetch your account
   starkli account fetch <YOUR_ADDRESS> \
     --output ~/.starkli-wallets/deployer/account.json \
     --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7
   ```

4. **Export Environment Variables**
   ```bash
   export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json
   export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json
   export STARKNET_NETWORK=sepolia  # or mainnet
   ```

### Deploy the Contract

**Option 1: Using npm script (recommended)**
```bash
pnpm contracts:deploy
```

**Option 2: Using bash script**
```bash
pnpm contracts:deploy:sh
```

**Option 3: Manual deployment**
```bash
# Build the contract
pnpm contracts:build

# Deploy using starkli
cd contracts
starkli declare target/dev/sonic_guardian_SonicGuardian.contract_class.json --network sepolia
starkli deploy <CLASS_HASH> --network sepolia
```

The deployment script will automatically:
- Build the Cairo contract
- Declare the contract class on Starknet
- Deploy a contract instance
- Update your `.env.local` with the contract address

### Verify Deployment

After deployment, add the contract address to `.env.local`:
```env
NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=0x...
```

See [contracts/README.md](contracts/README.md) for detailed deployment documentation.

## 🛡️ Security

### Pre-commit Hook
The project includes a pre-commit hook that scans for secrets before committing:
- Detects private keys, API keys, and passwords
- Prevents accidental secret commits
- Excludes `.example` files and package files

### Best Practices
- Never commit `.env.local` (already in `.gitignore`)
- Use environment variables for all secrets
- Rotate API keys regularly
- Use testnet for development

## 🎯 Usage

### Registration Flow
1. Enter a "Secret Vibe" (your recovery phrase)
2. Click "Generate & Mint Identity"
3. The system generates Strudel code and extracts DNA
4. Click "Simulate Wallet Lock" to proceed to recovery

### Recovery Flow
1. Enter the same secret vibe used during registration
2. Click "Generate Proof & Recover"
3. System verifies DNA match and recovers identity
4. Success/failure feedback with audio cues

### Advanced Features
- **Theme Toggle**: Switch between light, dark, and system themes
- **Audio Control**: Enable/disable audio feedback
- **Animations**: Toggle UI animations
- **Real AI**: Enable Google Gemini for code generation

## 🔧 API Endpoints

### DNA Extraction
- `POST /api/dna/extract` - Extract DNA from Strudel code
- `GET /api/dna/extract?code=...` - Synchronous extraction

### AI Agent
- `POST /api/agent/generate` - Generate code from prompt
- `GET /api/agent/generate?prompt=...` - Synchronous generation

### Features
- Rate limiting (10 requests/minute per IP)
- Input validation and sanitization
- CORS support with configurable origins
- Comprehensive error handling

## 🧪 Testing

Run the complete test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run specific test file:
```bash
npm test -- src/__tests__/dna.test.ts
```

## 🎨 Theme System

The application supports three themes:

1. **Light Theme**: Clean white background with dark text
2. **Dark Theme**: Dark background with light text
3. **System Theme**: Automatically follows system preference

### Customization
Themes are defined in `src/lib/theme.ts` with CSS custom properties for easy customization:

```typescript
const customTheme = {
  colors: {
    background: '#your-color',
    foreground: '#your-color',
    // ... other colors
  }
}
```

## 🔌 AI Integration

### Mock Agent (Default)
- Deterministic code generation
- No external dependencies
- Perfect for development and testing

### Google Gemini (Optional)
- Real AI-powered code generation
- Requires API key
- Fallback to mock agent on failure

### Configuration
```typescript
// Enable real AI
setRealAIEnabled(true);

// Use with specific options
const response = await generateStrudelCode(prompt, {
  useRealAI: true,
  apiKey: 'your-key',
  model: 'gemini-1.5-flash'
});
```

## 📊 Security Features

### Cryptographic Security
- **SHA-256 Hashing**: Industry-standard cryptographic hashing
- **Salt Generation**: Unique salt per session for security
- **Timestamp Tracking**: Session timing for audit trails

### Input Validation
- **Length Limits**: Prevents DoS attacks
- **Type Checking**: Ensures valid data types
- **Sanitization**: Removes malicious content

### Rate Limiting
- **IP-based Limits**: 10 requests per minute per IP
- **Memory-based**: No database dependencies
- **Configurable**: Easy to adjust limits

## 🚀 Production Deployment

### Environment Variables
```env
# Required for production
NODE_ENV=production
GEMINI_API_KEY=your_production_key

# Optional
NEXT_PUBLIC_USE_REAL_AI=true
```

### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel (recommended)
vercel
```

### Security Considerations
- Use HTTPS in production
- Set proper CORS origins
- Rotate API keys regularly
- Monitor rate limiting logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Write comprehensive tests
- Document public APIs

## 📈 Performance

### Optimizations
- **Lazy Loading**: Components load on demand
- **Caching**: AI responses cached for 5 minutes
- **Bundle Splitting**: Code split by routes
- **Image Optimization**: Next.js image optimization

### Monitoring
- Use browser dev tools for performance profiling
- Monitor API response times
- Check bundle size with `npm run build`

## 🐛 Troubleshooting

### Common Issues

**API Key Not Working**
- Verify Gemini API key format
- Check environment variable name
- Ensure key has proper permissions

**Theme Not Applying**
- Check CSS custom properties
- Verify theme initialization
- Clear browser cache

**Audio Not Playing**
- Check browser permissions
- Verify Web Audio API support
- Check audio context state

### Debug Mode
Enable debug logging:
```typescript
// In development
localStorage.setItem('debug', 'sonic:*');
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Strudel**: For the live coding syntax inspiration
- **Google Gemini**: For AI code generation capabilities
- **Next.js Team**: For the excellent framework
- **Tailwind CSS**: For beautiful, responsive styling

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Email: support@sonicguardian.dev

---

**Sonic Guardian** - Where sound meets security. 🎵🔒