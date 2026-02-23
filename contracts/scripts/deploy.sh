#!/bin/bash

# Sonic Guardian Contract Deployment Script
# This script builds and deploys the SonicGuardian contract to Starknet

set -e

echo "🎵 Sonic Guardian Deployment"
echo "=============================="

# Check if Scarb is installed
if ! command -v scarb &> /dev/null; then
    echo "❌ Scarb is not installed!"
    echo ""
    echo "Please install Scarb using one of these methods:"
    echo "  • Using asdf: asdf plugin add scarb && asdf install scarb latest"
    echo "  • Using curl: curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh"
    echo "  • Visit: https://docs.swmansion.com/scarb/download.html"
    exit 1
fi

echo "✅ Scarb found: $(scarb --version)"

# Check if starkli is installed
if ! command -v starkli &> /dev/null; then
    echo "❌ Starkli is not installed!"
    echo ""
    echo "Please install Starkli using:"
    echo "  curl https://get.starkli.sh | sh"
    echo "  starkliup"
    exit 1
fi

echo "✅ Starkli found: $(starkli --version)"

# Build the contract
echo ""
echo "🔨 Building contract..."
cd "$(dirname "$0")/.."
scarb build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Check for required environment variables
if [ -z "$STARKNET_ACCOUNT" ]; then
    echo ""
    echo "⚠️  STARKNET_ACCOUNT not set"
    echo "Please set up your Starknet account using:"
    echo "  starkli account fetch <ADDRESS> --output ~/.starkli-wallets/deployer/account.json"
    echo "  export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json"
    exit 1
fi

if [ -z "$STARKNET_KEYSTORE" ]; then
    echo ""
    echo "⚠️  STARKNET_KEYSTORE not set"
    echo "Please set up your keystore using:"
    echo "  starkli signer keystore from-key ~/.starkli-wallets/deployer/keystore.json"
    echo "  export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json"
    exit 1
fi

# Determine network
NETWORK=${STARKNET_NETWORK:-"sepolia"}
echo ""
echo "🌐 Deploying to: $NETWORK"

# Deploy the contract
echo ""
echo "🚀 Deploying SonicGuardian contract..."

# The contract class hash will be in target/dev/sonic_guardian_SonicGuardian.contract_class.json
CONTRACT_CLASS="target/dev/sonic_guardian_SonicGuardian.contract_class.json"

if [ ! -f "$CONTRACT_CLASS" ]; then
    echo "❌ Contract class file not found: $CONTRACT_CLASS"
    exit 1
fi

# Declare the contract
echo "📝 Declaring contract..."
CLASS_HASH=$(starkli declare "$CONTRACT_CLASS" --network "$NETWORK" 2>&1 | tee /dev/tty | grep -oP 'Class hash declared: \K0x[0-9a-fA-F]+' || echo "")

if [ -z "$CLASS_HASH" ]; then
    echo "⚠️  Contract may already be declared. Attempting to get class hash..."
    CLASS_HASH=$(starkli class-hash "$CONTRACT_CLASS")
fi

echo "✅ Class hash: $CLASS_HASH"

# Deploy the contract (no constructor arguments needed)
echo ""
echo "🎯 Deploying contract instance..."
DEPLOY_OUTPUT=$(starkli deploy "$CLASS_HASH" --network "$NETWORK" 2>&1 | tee /dev/tty)
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP 'Contract deployed: \K0x[0-9a-fA-F]+' || echo "")

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✨ Deployment successful!"
echo "=============================="
echo "Contract Address: $CONTRACT_ADDRESS"
echo "Class Hash: $CLASS_HASH"
echo "Network: $NETWORK"
echo ""
echo "📝 Add this to your .env.local:"
echo "NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=$CONTRACT_ADDRESS"
echo ""
