# Xverse Wallet Integration

Sonic Guardian supports **Xverse Wallet** for seamless Bitcoin integration on Starknet.

---

## Overview

[Xverse](https://www.xverse.app/) is a Bitcoin wallet that now supports Starknet, enabling:
- **BTC ↔ STRK swaps** directly in the wallet
- **Starknet dApp connectivity** via WalletConnect
- **Bitcoin DeFi access** (staking, yield farming, lending)
- **Eligibility for Bitcoin Track prizes** in hackathons

---

## For Users

### Installing Xverse

1. **Download**: Visit [xverse.app](https://www.xverse.app/)
2. **Install**: Available for iOS, Android, and Browser Extension
3. **Create Wallet**: Follow the setup wizard
4. **Enable Starknet**: Go to Settings → Networks → Enable Starknet

### Connecting to Sonic Guardian

1. Open Sonic Guardian app
2. Click **"Connect Wallet"**
3. Select **Xverse** from the wallet list
4. Approve the connection in Xverse
5. Start using Sonic Guardian!

### Benefits of Using Xverse

- ✅ **Bitcoin Native**: Built for Bitcoin, now with Starknet support
- ✅ **BTC ↔ STRK Swaps**: Swap directly in the wallet
- ✅ **Hackathon Eligible**: Qualifies for Bitcoin Track prizes
- ✅ **Secure**: Non-custodial, you control your keys
- ✅ **User-Friendly**: Best-in-class UX for Bitcoin users

---

## For Developers

### Wallet Connector Setup

Xverse works with `@starknet-react/core` as an injected wallet connector:

```typescript
import { useConnect } from '@starknet-react/core';

function ConnectButton() {
  const { connect, connectors } = useConnect();
  
  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  );
}
```

Xverse will appear automatically if installed as a browser extension.

### Detecting Xverse

```typescript
import { useAccount } from '@starknet-react/core';

function WalletStatus() {
  const { address, connector } = useAccount();
  
  if (connector?.name === 'Xverse') {
    return <div>Connected with Xverse!</div>;
  }
  
  return <div>Connected with {connector?.name}</div>;
}
```

### Bitcoin Integration Features

With Xverse connected, users can:
- **Swap BTC for STRK** on Starknet
- **Access Bitcoin DeFi** protocols
- **Bridge Bitcoin** to Starknet seamlessly
- **Qualify for Bitcoin-specific features** in your dApp

---

## Testing Xverse Integration

### Manual Testing

1. **Install Xverse** browser extension
2. **Create/import** a wallet
3. **Enable Starknet** in settings
4. **Visit Sonic Guardian** app
5. **Connect** using Xverse
6. **Verify** connection shows Xverse wallet address

### Expected Behavior

- ✅ Xverse appears in wallet connection modal
- ✅ Connection request shows in Xverse
- ✅ After approval, wallet address displays
- ✅ All app features work with Xverse-connected wallet

---

## Resources

- **[Xverse Website](https://www.xverse.app/)** - Download wallet
- **[Xverse Docs](https://docs.xverse.app/)** - Developer documentation
- **[Starknet React](https://starknet-react.com/)** - React hooks for Starknet
- **[Sonic Guardian](https://github.com/thisyearnofear/sonicguardian)** - Our GitHub repo

---

## Support

For issues with Xverse integration:
1. Check [Xverse Docs](https://docs.xverse.app/)
2. Join Xverse Discord
3. Check Sonic Guardian GitHub issues

---

**Last Updated:** July 8, 2026  
**Version:** 1.2.0
