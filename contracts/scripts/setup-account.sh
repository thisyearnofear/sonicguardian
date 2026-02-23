#!/bin/bash

# Starknet Account Setup Helper
# This script guides you through setting up a Starknet account for deployment

set -e

COLORS_RED='\033[0;31m'
COLORS_GREEN='\033[0;32m'
COLORS_YELLOW='\033[1;33m'
COLORS_BLUE='\033[0;34m'
COLORS_CYAN='\033[0;36m'
COLORS_NC='\033[0m' # No Color

echo -e "${COLORS_CYAN}"
echo "🎵 Sonic Guardian - Starknet Account Setup"
echo "==========================================="
echo -e "${COLORS_NC}"

# Check if starkli is installed
if ! command -v starkli &> /dev/null; then
    echo -e "${COLORS_RED}❌ Starkli is not installed!${COLORS_NC}"
    echo ""
    echo -e "${COLORS_YELLOW}Install Starkli using:${COLORS_NC}"
    echo "  curl https://get.starkli.sh | sh"
    echo "  starkliup"
    exit 1
fi

echo -e "${COLORS_GREEN}✅ Starkli found: $(starkli --version)${COLORS_NC}"
echo ""

# Create wallet directory
WALLET_DIR="$HOME/.starkli-wallets/deployer"
mkdir -p "$WALLET_DIR"

echo -e "${COLORS_BLUE}📁 Wallet directory: $WALLET_DIR${COLORS_NC}"
echo ""

# Step 1: Create keystore
echo -e "${COLORS_CYAN}Step 1: Create Keystore${COLORS_NC}"
echo "------------------------"

KEYSTORE_PATH="$WALLET_DIR/keystore.json"

if [ -f "$KEYSTORE_PATH" ]; then
    echo -e "${COLORS_YELLOW}⚠️  Keystore already exists at: $KEYSTORE_PATH${COLORS_NC}"
    read -p "Do you want to create a new one? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing keystore."
    else
        echo "Creating new keystore..."
        starkli signer keystore new "$KEYSTORE_PATH"
    fi
else
    echo "Creating new keystore..."
    starkli signer keystore new "$KEYSTORE_PATH"
fi

echo -e "${COLORS_GREEN}✅ Keystore ready${COLORS_NC}"
echo ""

# Step 2: Get testnet ETH
echo -e "${COLORS_CYAN}Step 2: Get Testnet ETH${COLORS_NC}"
echo "------------------------"
echo ""
echo "You need testnet ETH to deploy contracts."
echo ""
echo -e "${COLORS_YELLOW}1. Get your wallet address from your Starknet wallet (Argent or Braavos)${COLORS_NC}"
echo -e "${COLORS_YELLOW}2. Visit the faucet: ${COLORS_BLUE}https://starknet-faucet.vercel.app/${COLORS_NC}"
echo -e "${COLORS_YELLOW}3. Enter your address and request testnet ETH${COLORS_NC}"
echo ""
read -p "Press Enter once you have testnet ETH..."
echo ""

# Step 3: Fetch account
echo -e "${COLORS_CYAN}Step 3: Fetch Account${COLORS_NC}"
echo "------------------------"
echo ""

ACCOUNT_PATH="$WALLET_DIR/account.json"

if [ -f "$ACCOUNT_PATH" ]; then
    echo -e "${COLORS_YELLOW}⚠️  Account file already exists at: $ACCOUNT_PATH${COLORS_NC}"
    read -p "Do you want to fetch a new one? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing account."
    else
        read -p "Enter your Starknet account address (0x...): " ADDRESS
        echo "Fetching account..."
        starkli account fetch "$ADDRESS" --output "$ACCOUNT_PATH" --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7
    fi
else
    read -p "Enter your Starknet account address (0x...): " ADDRESS
    echo "Fetching account..."
    starkli account fetch "$ADDRESS" --output "$ACCOUNT_PATH" --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7
fi

echo -e "${COLORS_GREEN}✅ Account ready${COLORS_NC}"
echo ""

# Step 4: Export environment variables
echo -e "${COLORS_CYAN}Step 4: Export Environment Variables${COLORS_NC}"
echo "------------------------"
echo ""

echo "Add these to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
echo ""
echo -e "${COLORS_YELLOW}export STARKNET_ACCOUNT=\"$ACCOUNT_PATH\"${COLORS_NC}"
echo -e "${COLORS_YELLOW}export STARKNET_KEYSTORE=\"$KEYSTORE_PATH\"${COLORS_NC}"
echo -e "${COLORS_YELLOW}export STARKNET_NETWORK=\"sepolia\"${COLORS_NC}"
echo ""

# Export for current session
export STARKNET_ACCOUNT="$ACCOUNT_PATH"
export STARKNET_KEYSTORE="$KEYSTORE_PATH"
export STARKNET_NETWORK="sepolia"

echo -e "${COLORS_GREEN}✅ Variables exported for current session${COLORS_NC}"
echo ""

# Step 5: Verify setup
echo -e "${COLORS_CYAN}Step 5: Verify Setup${COLORS_NC}"
echo "------------------------"
echo ""

echo "Checking account balance..."
ADDRESS=$(cat "$ACCOUNT_PATH" | grep -o '"address":"[^"]*' | cut -d'"' -f4)

if [ -n "$ADDRESS" ]; then
    echo -e "${COLORS_GREEN}Account Address: $ADDRESS${COLORS_NC}"
    
    # Try to get balance
    BALANCE=$(starkli balance "$ADDRESS" --network sepolia 2>&1 || echo "Could not fetch balance")
    echo "Balance: $BALANCE"
else
    echo -e "${COLORS_RED}Could not extract address from account file${COLORS_NC}"
fi

echo ""
echo -e "${COLORS_GREEN}✨ Setup Complete!${COLORS_NC}"
echo ""
echo -e "${COLORS_CYAN}Next Steps:${COLORS_NC}"
echo "1. Make sure the environment variables are in your shell profile"
echo "2. Restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
echo "3. Deploy the contract: pnpm contracts:deploy"
echo ""
echo -e "${COLORS_YELLOW}📚 For more help, see: contracts/README.md${COLORS_NC}"
echo ""
