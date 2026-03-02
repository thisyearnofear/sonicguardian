# Frontend-Only Gifting System

## Overview

Sonic Guardian now features a completely frontend-only Bitcoin gifting system that maintains privacy while enabling secure gift transfers using musical DNA and zero-knowledge proofs.

## Key Features

- ✅ **No External APIs** - All operations happen client-side
- ✅ **Better Privacy** - No sensitive data sent to third-party servers
- ✅ **Offline Capable** - Works without network connectivity
- ✅ **ZK Privacy Preserved** - Musical DNA remains private
- ✅ **Deterministic IDs** - Same musical code always generates same vault ID

## How It Works

### 1. Gift Creation

```typescript
const giftingService = new GiftingService();

// Create a gift vault
const vault = await giftingService.createGift(
  senderAddress,
  '0.001', // BTC amount
  's("bd*4").cpm(120)', // Musical code
  ['bd rhythm', '4 beats', '120 bpm'] // Musical chunks
);
```

**Process:**
1. Extract DNA from musical code using SHA-256
2. Generate cryptographically secure blinding factor
3. Compute Pedersen commitment: `commitment = pedersen(dnaHash, blinding)`
4. Generate deterministic vault ID from commitment
5. Store vault locally with encrypted blinding factor

### 2. Gift Claiming

```typescript
// Claim a gift
const success = await giftingService.claimGift(
  vaultId,
  recipientAddress,
  's("bd*4").cpm(120)', // Musical code
  blinding // From sender
);
```

**Process:**
1. Retrieve vault from local storage
2. Extract DNA from provided musical code
3. Verify commitment matches: `pedersen(dnaHash, blinding) === vault.commitment`
4. Update vault status to 'claimed'

### 3. Secure Blinding Factor Management

```typescript
// Encrypt blinding factor with wallet address
const encrypted = vaultManager.encryptBlinding(blinding, walletAddress);

// Decrypt when needed
const decrypted = vaultManager.decryptBlinding(encrypted, walletAddress);
```

**Security:**
- XOR-based encryption tied to wallet address
- Can be upgraded to AES-GCM for production
- Blinding factors never stored in plain text

## API Reference

### GiftingService

#### `createGift(senderAddress, amountBtc, musicalCode, chunks)`
Creates a new gift vault locally.

**Returns:** `GiftVault | null`

#### `claimGift(vaultId, recipientAddress, musicalCode, blinding)`
Claims a gift by verifying musical DNA.

**Returns:** `Promise<boolean>`

#### `verifyClaim(vaultId, musicalCode, blinding)`
Verifies if musical code can claim a vault without updating status.

**Returns:** `{ success: boolean; message: string }`

#### `listUserGifts(recipientAddress)`
Lists all claimable gifts for a recipient.

**Returns:** `GiftVault[]`

#### `listSenderGifts(senderAddress)`
Lists all gifts created by a sender.

**Returns:** `GiftVault[]`

### Vault Management

#### `generateVaultId(commitment)`
Generates deterministic vault ID from Pedersen commitment.

**Returns:** `string` (format: `vault_${commitment.substring(0, 16)}`)

#### `encryptBlinding(blinding, walletAddress)`
Encrypts blinding factor with wallet address.

**Returns:** `string` (Base64 encoded)

#### `decryptBlinding(encryptedBlinding, walletAddress)`
Decrypts blinding factor with wallet address.

**Returns:** `string`

## Data Structures

### GiftVault

```typescript
interface GiftVault {
  id: string;                    // Deterministic vault ID
  sender: string;               // Sender wallet address
  amount: string;               // BTC amount as string
  commitment: string;           // Pedersen commitment
  blinding: string;             // Encrypted blinding factor
  status: 'locked' | 'claimed' | 'refunded';
  musicalChunks: string[];      // Musical description chunks
  createdAt: number;            // Timestamp
  claimedAt?: number;           // Claim timestamp
  recipient?: string;           // Recipient address
}
```

### VaultMetadata

```typescript
interface VaultMetadata {
  vaultId: string;
  sender: string;
  amount: string;
  status: 'locked' | 'claimed' | 'refunded';
  createdAt: number;
  musicalChunks: string[];
}
```

## Privacy Benefits

1. **No External Dependencies** - All operations client-side
2. **Zero-Knowledge** - Only commitment stored, not actual DNA
3. **Deterministic** - Same musical code always generates same vault ID
4. **Encrypted Storage** - Blinding factors encrypted with wallet addresses
5. **Offline Operation** - No network required after initial setup

## Testing

Comprehensive test suite available in `src/lib/gifting.test.ts`:

```bash
# Run tests
npm test
```

**Test Coverage:**
- Gift creation with deterministic IDs
- Claim verification with correct/incorrect DNA
- User gift listing functionality
- Claim verification without status updates
- Deterministic ID generation

## Migration from API-based System

The frontend-only system replaces mock API calls with local storage operations:

**Before:**
```typescript
// Mock API call
const response = await fetch(`${this.baseUrl}/gifts`, {
  method: 'POST',
  // ...
});
```

**After:**
```typescript
// Local storage operation
const success = vaultManager.createVault(vault);
```

## Future Enhancements

1. **Production Encryption** - Upgrade to AES-GCM for blinding factors
2. **Multi-chain Support** - Extend to other blockchain networks
3. **Social Recovery** - Add social recovery mechanisms
4. **Batch Operations** - Support for bulk gift operations
5. **Analytics** - Privacy-preserving usage analytics

## Security Considerations

1. **Blinding Factor Security** - Never share blinding factors publicly
2. **Wallet Address Binding** - Encryption tied to specific wallet addresses
3. **Local Storage Security** - Consider additional encryption layers
4. **Commitment Verification** - Always verify commitments before claiming
5. **Status Updates** - Atomic operations for status updates

## Integration Examples

### React Component Integration

```tsx
import { GiftingService } from '../lib/gifting';

export function GiftApp() {
  const giftingService = new GiftingService();
  
  const handleCreateGift = async () => {
    const vault = await giftingService.createGift(
      senderAddress,
      amount,
      musicalCode,
      chunks
    );
    
    if (vault) {
      console.log('Gift created:', vault.id);
    }
  };
}
```

### CLI Integration

```typescript
import { GiftingService } from './lib/gifting';

const service = new GiftingService();

// Create gift
const vault = await service.createGift(
  process.argv[2], // sender
  process.argv[3], // amount
  process.argv[4], // musical code
  process.argv.slice(5) // chunks
);

console.log('Vault ID:', vault?.id);