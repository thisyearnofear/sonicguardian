#!/bin/bash
# Sonic Guardian - Testnet Deployment Script
# Uses environment variables for secure credential management

set -e

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🎵 Sonic Guardian - Starknet Sepolia Deployment   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check required environment variables
check_env() {
    if [ -z "${!1}" ]; then
        echo -e "${RED}✗ Error: $2 is not set${NC}"
        echo -e "${YELLOW}  Please add it to your .env.local file:${NC}"
        echo -e "${YELLOW}  $2=your_value_here${NC}"
        echo ""
        exit 1
    fi
    echo -e "${GREEN}✓ $2 is set${NC}"
}

echo "Checking environment variables..."
check_env STARKNET_ACCOUNT_ADDRESS "STARKNET_ACCOUNT_ADDRESS"
check_env STARKNET_ACCOUNT_PRIVATE_KEY "STARKNET_ACCOUNT_PRIVATE_KEY"

# Use custom RPC or default
RPC_URL="${STARKNET_RPC_URL:-https://starknet-sepolia.public.blastapi.io/rpc/v0_7}"
echo -e "${GREEN}✓ RPC URL: $RPC_URL${NC}"
echo ""

# Build contract
echo -e "${YELLOW}Building Cairo contract...${NC}"
cd contracts
scarb build
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Declare contract
echo -e "${YELLOW}Declaring contract to Starknet Sepolia...${NC}"
echo -e "${BLUE}This may take 1-2 minutes...${NC}"

CLASS_HASH=$(starkli declare \
    target/dev/sonic_guardian_SonicGuardian.contract_class.json \
    --account "${STARKNET_ACCOUNT_ADDRESS}" \
    --keystore "${STARKNET_ACCOUNT_PRIVATE_KEY}" \
    --rpc "${RPC_URL}" \
    --watch \
    2>&1 | grep -o '0x[a-fA-F0-9]\+' | head -1)

if [ -z "$CLASS_HASH" ]; then
    echo -e "${RED}✗ Declaration failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contract declared!${NC}"
echo -e "${BLUE}Class Hash: ${CLASS_HASH}${NC}"
echo ""

# Deploy contract
echo -e "${YELLOW}Deploying contract...${NC}"

CONSTRUCTOR_CALldata="0x"  # No constructor arguments

DEPLOY_OUTPUT=$(starkli deploy \
    "${CLASS_HASH}" \
    "${CONSTRUCTOR_CALldata}" \
    --account "${STARKNET_ACCOUNT_ADDRESS}" \
    --keystore "${STARKNET_ACCOUNT_PRIVATE_KEY}" \
    --rpc "${RPC_URL}" \
    --watch \
    2>&1)

CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o '0x[a-fA-F0-9]\+' | head -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}✗ Deployment failed${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ Contract deployed!${NC}"
echo ""
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
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Add this to your .env.local:"
echo -e "   ${BLUE}NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=${CONTRACT_ADDRESS}${NC}"
echo "2. Update contracts/README.md with the address"
echo "3. Test the contract functions"
echo ""

# Save deployment info
cat > deployment-info.json << EOF
{
  "network": "starknet-sepolia",
  "contractAddress": "${CONTRACT_ADDRESS}",
  "classHash": "${CLASS_HASH}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "${GREEN}✓ Deployment info saved to deployment-info.json${NC}"
