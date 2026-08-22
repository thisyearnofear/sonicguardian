import { num, type WalletAccountV6 } from 'starknet';
import type { STRK20_ACTION } from '@starknet-io/types-js';
import {
  STRK_TOKEN_MAINNET,
  getStrk20Provider,
  recordTxHash,
} from '@/lib/strk20/constants';
import { waitForStrk20Tx } from '@/lib/strk20/client';
import type { AcousticAuthorizationPayload } from '@/lib/sonic-authorization';

/** Minimum STRK round-trip through the recovery anonymizer (18 decimals). */
export const RECOVERY_ORACLE_STRK_WEI = BigInt('1000000000000000000'); // 1 STRK

export function getRecoveryHelperAddress(): string | null {
  const addr =
    process.env.NEXT_PUBLIC_RECOVERY_HELPER_MAINNET ??
    process.env.NEXT_PUBLIC_STRK20_RECOVERY_HELPER_MAINNET ??
    '0x0';
  return addr && addr !== '0x0' ? addr : null;
}

export function getSonicGuardianAddress(): string {
  return (
    process.env.NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS ||
    '0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de'
  );
}

export function buildPrivateRecoveryActions(
  walletAddress: string,
  auth: AcousticAuthorizationPayload,
  helperAddress: string,
  guardianAddress: string = getSonicGuardianAddress(),
  token: string = STRK_TOKEN_MAINNET,
  strkAmountWei: bigint = RECOVERY_ORACLE_STRK_WEI,
): STRK20_ACTION[] {
  const helper = num.toHex(helperAddress);
  const guardian = num.toHex(guardianAddress);
  const tokenHex = num.toHex(token);

  return [
    {
      type: 'withdraw',
      token: tokenHex,
      amount: num.toHex(strkAmountWei),
      recipient: helper,
    },
    {
      type: 'transfer',
      token: tokenHex,
      amount: 'OPEN',
      recipient: walletAddress,
    },
    {
      type: 'invoke',
      contract: helper,
      calldata: [
        guardian,
        auth.btcFelt,
        auth.messageHash,
        auth.signatureR,
        auth.signatureS,
        tokenHex,
        '${poolAddress}',
        '${openNoteIds[0]}',
      ],
    },
  ];
}

export async function submitPrivateRecoveryAuthorization(
  account: WalletAccountV6,
  walletAddress: string,
  auth: AcousticAuthorizationPayload,
): Promise<string> {
  const helper = getRecoveryHelperAddress();
  if (!helper) {
    throw new Error(
      'Recovery helper not deployed. Set NEXT_PUBLIC_RECOVERY_HELPER_MAINNET after deploying RecoveryInvokeHelper.',
    );
  }

  const actions = buildPrivateRecoveryActions(walletAddress, auth, helper);
  const { transaction_hash } = await account.strk20InvokeTransaction(actions);
  const provider = getStrk20Provider(true);
  await waitForStrk20Tx(provider, transaction_hash);
  recordTxHash(transaction_hash);
  return transaction_hash;
}
