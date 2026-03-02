#!/bin/bash
# Sonic Guardian - Complete Deployment Script
# Deploys: 1) Account (if needed), 2) Contract

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🎵 Sonic Guardian - Starknet Sepolia Deployment   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
elif [ -f .env ]; then
    source .env
fi

# Configuration
ACCOUNT_CONFIG="${STARKNET_ACCOUNT_CONFIG:-~/.starkli-wallets/sonicguardian/account.json}"
KEYSTORE="${STARKNET_KEYSTORE:-~/.starkli-wallets/sonicguardian/keystore.json}"
KEYSTORE_PASSWORD="${STARKNET_KEYSTORE_PASSWORD:-}"
PRIVATE_KEY="${STARKNET_PRIVATE_KEY:-}"
RPC="${STARKNET_RPC_URL:-https://free-rpc.pathfinder.dev/sepolia}"

# Check prerequisites
echo -e "${YELLOW}Checking environment...${NC}"

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}✗ STARKNET_PRIVATE_KEY not set${NC}"
    echo -e "${YELLOW}  Please add it to your .env.local file${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Private key loaded${NC}"

if [ ! -f "$ACCOUNT_CONFIG" ]; then
    echo -e "${YELLOW}⚠ Account config not found, creating...${NC}"
    starkli account argent init "$ACCOUNT_CONFIG" --private-key "$PRIVATE_KEY"
fi
echo -e "${GREEN}✓ Account config ready${NC}"

echo -e "${BLUE}  Address: 0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df${NC}"
echo ""

# Step 1: Deploy Account (if not already deployed)
echo -e "${YELLOW}Step 1: Checking account deployment...${NC}"

ACCOUNT_DEPLOYED=$(starkli class-hash-at 0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df --rpc "$RPC" 2>&1 || echo "not_deployed")

if [[ "$ACCOUNT_DEPLOYED" == *"not_deployed"* ]] || [[ "$ACCOUNT_DEPLOYED" == *"error"* ]] || [[ "$ACCOUNT_DEPLOYED" == *"0x0"* ]]; then
    echo -e "${YELLOW}Account not deployed, deploying now...${NC}"
    starkli account deploy \
        "$ACCOUNT_CONFIG" \
        --private-key "$PRIVATE_KEY" \
        --rpc "$RPC"
    echo -e "${GREEN}✓ Account deployed!${NC}"
else
    echo -e "${GREEN}✓ Account already deployed${NC}"
fi
echo ""

# Step 2: Build Contract
echo -e "${YELLOW}Step 2: Building Cairo contract...${NC}"
cd "$(dirname "$0")"
scarb build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 3: Declare Contract
echo -e "${YELLOW}Step 3: Declaring contract class...${NC}"
echo -e "${BLUE}This may take 1-2 minutes...${NC}"

CLASS_HASH=$(starkli declare \
    target/dev/sonic_guardian_SonicGuardian.contract_class.json \
    --private-key "$PRIVATE_KEY" \
    --rpc "$RPC" \
    2>&1 | grep -o '0x[a-fA-F0-9]\+' | tail -1 || echo "")

if [ -z "$CLASS_HASH" ]; then
    echo -e "${RED}✗ Declaration failed${NC}"
    echo -e "${YELLOW}This might be due to Cairo compiler version mismatch.${NC}"
    echo -e "${YELLOW}See contracts/DEPLOYMENT_STATUS.md for details.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contract declared${NC}"
echo -e "${BLUE}  Class Hash: $CLASS_HASH${NC}"
echo ""

# Step 4: Deploy Contract
echo -e "${YELLOW}Step 4: Deploying contract instance...${NC}"

CONTRACT_ADDRESS=$(starkli deploy \
    "$CLASS_HASH" \
    --private-key "$PRIVATE_KEY" \
    --rpc "$RPC" \
    2>&1 | grep -o '0x[a-fA-F0-9]\+' | tail -1 || echo "")

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contract deployed!${NC}"
echo ""

# Success!
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🎉 Deployment Successful! 🎉                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Contract Address:${NC}"
echo -e "${YELLOW}${CONTRACT_ADDRESS}${NC}"
echo ""
echo -e "${BLUE}View on Explorer:${NC}"
echo -e "${YELLOW}https://sepolia.starkscan.co/contract/${CONTRACT_ADDRESS}${NC}"
echo -e "${YELLOW}https://sepolia.voyager.online/contract/${CONTRACT_ADDRESS}${NC}"
echo ""
echo -e "${BLUE}Class Hash:${NC}"
echo -e "${YELLOW}${CLASS_HASH}${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update .env.local:"
echo -e "   ${BLUE}NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=${CONTRACT_ADDRESS}${NC}"
echo "2. Update contracts/README.md with the address"
echo "3. Commit changes (but NOT .env.local!)"
echo ""

# Save deployment info
cat > deployment-info.json << EOF
{
  "network": "starknet-sepolia",
  "contractAddress": "${CONTRACT_ADDRESS}",
  "classHash": "${CLASS_HASH}",
  "accountAddress": "0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "${GREEN}✓ Deployment info saved to deployment-info.json${NC}"
