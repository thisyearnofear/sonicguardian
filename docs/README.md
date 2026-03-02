# Sonic Guardian Documentation

**Deployed on Starknet Sepolia** 🎉

## ✅ Deployment Status

| Component | Status | Link |
|-----------|--------|------|
| **Account** | ✅ Deployed | [Voyager](https://sepolia.voyager.online/contract/0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df) |
| **Contract** | ✅ Deployed | [Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de) |
| **Frontend** | ✅ Production-Ready | All features functional |

---

## 📖 Documentation Index

### Getting Started
- **[Quick Start](../QUICKSTART.md)** - TL;DR for the project
- **[README](../README.md)** - Overview & hackathon submission

### Technical Documentation
- **[Architecture](./ARCHITECTURE.md)** - System design & privacy guarantees
- **[Agent API](./AGENTS.md)** - REST API & MCP server integration
- **[Strudel Integration](./STRUDEL.md)** - Musical pattern generation

### Deployment
- **[Contract Status](../contracts/DEPLOYMENT_STATUS.md)** - Current deployment status
- **[Deployment Guide](../contracts/DEPLOYMENT.md)** - Full deployment instructions
- **[Environment Setup](../.env.example)** - Environment variables reference

### Legal & Compliance
- **[Privacy Policy](./PRIVACY.md)** - Data handling & privacy guarantees

---

## 🎯 Quick Navigation

### For Hackathon Judges
1. **[QUICKSTART.md](../QUICKSTART.md)** - Project overview
2. **[Pattern Explorer](../src/components/PatternExplorer.tsx)** - Interactive demos
3. **[Contract Status](../contracts/DEPLOYMENT_STATUS.md)** - Deployment info
4. **[Account TX](https://sepolia.starkscan.co/tx/0x06ba17c934fe2480c1e1f2fbc6afba661b642fc60b8beddba6b9b397134c476e)** - On-chain proof

### For Developers
1. **[Architecture](./ARCHITECTURE.md)** - System design
2. **[Agent API](./AGENTS.md)** - Integration guide
3. **[Deployment Guide](../contracts/DEPLOYMENT.md)** - Deploy your own

### For Users
1. **[QUICKSTART.md](../QUICKSTART.md)** - How to use
2. **[Privacy Policy](./PRIVACY.md)** - Data handling

---

## 🎼 Strudel Features

Our Pattern Explorer showcases **16+ interactive demos**:

### Rhythm
- Basic rhythms (`*4`, `*8`)
- Syncopation (`[~ x]`, `[x ~]`)
- Polyrhythms (`/3`, Euclidean)
- Rotation (`<>`)

### Harmony
- Scales (major, minor, dorian, etc.)
- Chord progressions (I-V-vi-IV, ii-V-I)
- Arpeggios

### Transformations
- Time: `slow()`, `fast()`
- Probability: `?0.5`, `sometimes()`
- Pattern: `<>`, `stack()`

### Effects
- Filters: `lpf()`, `hpf()`, `lpq()`
- Drive: `distort()`, `crush()`
- Space: `room()`, `delay()`, `echo()`

**Try it:** Click "🎓 Explore 16+ Strudel Features" in the app!

---

## 📊 Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅ Complete | Pattern Explorer, Gift App |
| AI Integration | ✅ Complete | Venice AI, fallback patterns |
| DNA Extraction | ✅ Complete | Client-side, deterministic |
| Starknet Account | ✅ Deployed | Sepolia testnet |
| Cairo Contract | ⏸️ Pending | Tooling version mismatch |
| Documentation | ✅ Complete | This docs hub |

---

## 🔗 External Resources

- **[Starknet](https://starknet.io/)** - Layer 2 scaling
- **[Strudel](https://strudel.cc/)** - Live coding music
- **[Venice AI](https://venice.ai/)** - Privacy-first AI
- **[Starkscan](https://starkscan.co/)** - Block explorer
- **[Voyager](https://voyager.online/)** - Block explorer

---

**Last Updated:** March 2, 2026  
**Version:** 1.2.0
