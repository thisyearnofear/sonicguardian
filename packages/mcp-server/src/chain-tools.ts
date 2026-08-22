/**
 * Chain-backed MCP tools — reads Sonic Guardian contract via RPC.
 * Patterns stay client-side; agents submit messageHash + (r,s) only.
 */

import { RpcProvider, Contract } from 'starknet';

const DEFAULT_CONTRACT =
  '0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de';

const VIEW_ABI = [
  {
    name: 'SonicGuardian',
    type: 'interface',
    items: [
      {
        name: 'get_commitment',
        type: 'function',
        inputs: [{ name: 'btc_address', type: 'core::felt252' }],
        outputs: [{ type: 'core::felt252' }],
        state_mutability: 'view',
      },
      {
        name: 'get_acoustic_key',
        type: 'function',
        inputs: [{ name: 'btc_address', type: 'core::felt252' }],
        outputs: [{ type: 'core::felt252' }],
        state_mutability: 'view',
      },
      {
        name: 'verify_acoustic_signature',
        type: 'function',
        inputs: [
          { name: 'btc_address', type: 'core::felt252' },
          { name: 'message_hash', type: 'core::felt252' },
          { name: 'signature_r', type: 'core::felt252' },
          { name: 'signature_s', type: 'core::felt252' },
        ],
        outputs: [{ type: 'core::bool' }],
        state_mutability: 'view',
      },
      {
        name: 'get_guardian_count',
        type: 'function',
        inputs: [],
        outputs: [{ type: 'core::integer::u256' }],
        state_mutability: 'view',
      },
    ],
  },
] as const;

function getProvider(): RpcProvider {
  const url =
    process.env.STARKNET_RPC_URL ||
    process.env.NEXT_PUBLIC_STARKNET_SEPOLIA_RPC ||
    'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';
  return new RpcProvider({ nodeUrl: url });
}

function getContract(): Contract {
  const address = (process.env.SONIC_GUARDIAN_ADDRESS ||
    process.env.NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS ||
    DEFAULT_CONTRACT) as `0x${string}`;
  return new Contract({ abi: VIEW_ABI as never, address, providerOrAccount: getProvider() });
}

async function hashStringToFelt(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const MODULO = BigInt('0x800000000000011000000000000000000000000000000000000000000000001');
  return (BigInt('0x' + hex) % MODULO).toString();
}

export async function chainGuardianStatus(btcAddress: string) {
  const contract = getContract();
  const feltBtc = await hashStringToFelt(btcAddress);
  const [commitment, acousticKey, count] = await Promise.all([
    contract.get_commitment(feltBtc),
    contract.get_acoustic_key(feltBtc),
    contract.get_guardian_count(),
  ]);
  const c = commitment?.toString?.() ?? String(commitment);
  return {
    btcAddress,
    registered: c !== '0' && c !== '0x0',
    commitment: c,
    acousticKey: acousticKey?.toString?.() ?? String(acousticKey),
    guardianCount: Number(count?.low ?? count ?? 0),
  };
}

export async function chainVerifyAcousticZk(
  btcAddress: string,
  messageHash: string,
  signatureR: string,
  signatureS: string,
) {
  const contract = getContract();
  const feltBtc = await hashStringToFelt(btcAddress);
  const verified = await contract.verify_acoustic_signature(
    feltBtc,
    messageHash,
    signatureR,
    signatureS,
  );
  return { verified: Boolean(verified), method: 'zk_acoustic_signature' as const };
}

export function agentValidationManifest() {
  return {
    name: 'Sonic Guardian',
    description: 'Human sonic authorship validation for agents (ERC-8004 compatible)',
    validationRegistry: 'starknet_acoustic_zk',
    tools: ['sonic_guardian_chain_status', 'sonic_guardian_verify_zk', 'sonic_guardian_agent_manifest'],
    privacy: 'Musical pattern never sent to MCP server — only messageHash and signature',
  };
}
