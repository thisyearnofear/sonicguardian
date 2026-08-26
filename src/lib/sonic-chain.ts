import { RpcProvider, Contract } from 'starknet';
import { abi } from '@/lib/abi';
import { hashStringToFelt, isValidBtcAddress } from '@/lib/crypto';

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS ||
  '0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de') as `0x${string}`;

let _provider: RpcProvider | undefined;

function getProvider(): RpcProvider {
  if (!_provider) {
    const url =
      process.env.NEXT_PUBLIC_STARKNET_SEPOLIA_RPC ||
      process.env.STARKNET_RPC_URL ||
      'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';
    _provider = new RpcProvider({ nodeUrl: url });
  }
  return _provider;
}

export async function readGuardianOnChain(btcAddress: string) {
  if (!isValidBtcAddress(btcAddress)) {
    throw new Error('Invalid Bitcoin address');
  }
  const provider = getProvider();
  const contract = new Contract({
    abi: abi as never,
    address: CONTRACT_ADDRESS,
    providerOrAccount: provider,
  });
  const feltBtc = await hashStringToFelt(btcAddress);

  const [commitment, acousticKey] = await Promise.all([
    contract.get_commitment(feltBtc),
    contract.get_acoustic_key(feltBtc),
  ]);

  const commitmentStr = commitment?.toString?.() ?? String(commitment);
  const registered = commitmentStr !== '0' && commitmentStr !== '0x0';

  return {
    btcAddress,
    registered,
    commitment: commitmentStr,
    acousticKey: acousticKey?.toString?.() ?? String(acousticKey),
    contract: CONTRACT_ADDRESS,
    network: 'sepolia',
  };
}

export async function verifyAcousticOnChain(
  btcAddress: string,
  messageHash: string,
  signatureR: string,
  signatureS: string,
): Promise<boolean> {
  const provider = getProvider();
  const contract = new Contract({
    abi: abi as never,
    address: CONTRACT_ADDRESS,
    providerOrAccount: provider,
  });
  const feltBtc = await hashStringToFelt(btcAddress);
  return Boolean(
    await contract.verify_acoustic_signature(feltBtc, messageHash, signatureR, signatureS),
  );
}

/** Agent manifest for Sonic Guardian validation adapter. */
export function getAgentValidationManifest() {
  return {
    name: 'Sonic Guardian Validation Adapter',
    description:
      'Validates human sonic authorship via on-chain acoustic ECDSA — pattern never transmitted.',
    version: '1.0.0',
    validationMethod: 'starknet_acoustic_zk',
    endpoints: {
      mcp: 'packages/mcp-server',
      chainStatus: '/api/agent/chain',
    },
    supportedTrust: ['crypto-economic', 'tee', 'zkml'],
    tags: ['identity', 'recovery', 'strk20', 'bitcoin', 'erc-8004-validation'],
  };
}
