#!/usr/bin/env node

/**
 * Sonic Guardian Contract Deployment Script
 * 
 * This script provides an interactive deployment experience for the SonicGuardian contract.
 * It handles building, declaring, and deploying to Starknet.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (options.ignoreError) {
      return null;
    }
    throw error;
  }
}

function checkCommand(command, name) {
  const result = exec(`command -v ${command}`, { silent: true, ignoreError: true });
  return result !== null;
}

async function main() {
  log('\n🎵 Sonic Guardian Contract Deployment', 'cyan');
  log('======================================\n', 'cyan');

  // Check prerequisites
  log('Checking prerequisites...', 'blue');
  
  if (!checkCommand('scarb', 'Scarb')) {
    log('❌ Scarb is not installed!', 'red');
    log('\nInstall Scarb using one of these methods:', 'yellow');
    log('  • curl --proto \'=https\' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh');
    log('  • brew install scarb (macOS)');
    log('  • asdf plugin add scarb && asdf install scarb latest\n');
    log('Visit: https://docs.swmansion.com/scarb/download.html', 'cyan');
    process.exit(1);
  }
  
  const scarbVersion = exec('scarb --version', { silent: true }).trim();
  log(`✅ Scarb found: ${scarbVersion}`, 'green');

  if (!checkCommand('starkli', 'Starkli')) {
    log('❌ Starkli is not installed!', 'red');
    log('\nInstall Starkli using:', 'yellow');
    log('  curl https://get.starkli.sh | sh');
    log('  starkliup\n');
    process.exit(1);
  }

  const starkliVersion = exec('starkli --version', { silent: true }).trim();
  log(`✅ Starkli found: ${starkliVersion}`, 'green');

  // Build the contract
  log('\n🔨 Building contract...', 'blue');
  const contractsDir = path.join(__dirname, '..');
  process.chdir(contractsDir);
  
  try {
    exec('scarb build');
    log('✅ Build successful!', 'green');
  } catch (error) {
    log('❌ Build failed!', 'red');
    process.exit(1);
  }

  // Check for contract class file
  const contractClassPath = 'target/dev/sonic_guardian_SonicGuardian.contract_class.json';
  if (!fs.existsSync(contractClassPath)) {
    log(`❌ Contract class file not found: ${contractClassPath}`, 'red');
    process.exit(1);
  }

  // Check environment setup
  log('\n🔍 Checking deployment configuration...', 'blue');
  
  const accountPath = process.env.STARKNET_ACCOUNT;
  const keystorePath = process.env.STARKNET_KEYSTORE;
  const network = process.env.STARKNET_NETWORK || 'sepolia';

  if (!accountPath) {
    log('⚠️  STARKNET_ACCOUNT not set', 'yellow');
    log('\nSet up your account:', 'yellow');
    log('  1. Create keystore: starkli signer keystore new ~/.starkli-wallets/deployer/keystore.json');
    log('  2. Get testnet ETH: https://starknet-faucet.vercel.app/');
    log('  3. Fetch account: starkli account fetch <ADDRESS> --output ~/.starkli-wallets/deployer/account.json');
    log('  4. Export: export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json\n');
    process.exit(1);
  }

  if (!keystorePath) {
    log('⚠️  STARKNET_KEYSTORE not set', 'yellow');
    log('\nExport your keystore path:', 'yellow');
    log('  export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json\n');
    process.exit(1);
  }

  log(`✅ Account: ${accountPath}`, 'green');
  log(`✅ Keystore: ${keystorePath}`, 'green');
  log(`✅ Network: ${network}`, 'green');

  // Declare the contract
  log('\n📝 Declaring contract class...', 'blue');
  let classHash;
  
  try {
    const declareOutput = exec(
      `starkli declare ${contractClassPath} --network ${network}`,
      { silent: false }
    );
    
    const match = declareOutput.match(/Class hash declared:\s*(0x[0-9a-fA-F]+)/);
    if (match) {
      classHash = match[1];
    }
  } catch (error) {
    log('⚠️  Contract may already be declared', 'yellow');
    const hashOutput = exec(`starkli class-hash ${contractClassPath}`, { silent: true });
    classHash = hashOutput.trim();
  }

  if (!classHash) {
    log('❌ Failed to get class hash', 'red');
    process.exit(1);
  }

  log(`✅ Class hash: ${classHash}`, 'green');

  // Deploy the contract
  log('\n🎯 Deploying contract instance...', 'blue');
  let contractAddress;

  try {
    const deployOutput = exec(
      `starkli deploy ${classHash} --network ${network}`,
      { silent: false }
    );
    
    const match = deployOutput.match(/Contract deployed:\s*(0x[0-9a-fA-F]+)/);
    if (match) {
      contractAddress = match[1];
    }
  } catch (error) {
    log('❌ Deployment failed!', 'red');
    process.exit(1);
  }

  if (!contractAddress) {
    log('❌ Failed to get contract address', 'red');
    process.exit(1);
  }

  // Success!
  log('\n✨ Deployment successful!', 'green');
  log('======================================', 'cyan');
  log(`Contract Address: ${contractAddress}`, 'bright');
  log(`Class Hash: ${classHash}`, 'bright');
  log(`Network: ${network}`, 'bright');
  log('\n📝 Add this to your .env.local:', 'yellow');
  log(`NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=${contractAddress}`, 'bright');
  log('');

  // Update .env.local if it exists
  const envLocalPath = path.join(__dirname, '../../.env.local');
  if (fs.existsSync(envLocalPath)) {
    let envContent = fs.readFileSync(envLocalPath, 'utf8');
    
    if (envContent.includes('NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=.*/,
        `NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=${contractAddress}\n`;
    }
    
    fs.writeFileSync(envLocalPath, envContent);
    log('✅ Updated .env.local with contract address', 'green');
  }

  log('\n🎉 Ready to use! Connect your wallet and anchor your Sonic DNA.\n', 'magenta');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
