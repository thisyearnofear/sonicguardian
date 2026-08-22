import { NextRequest, NextResponse } from 'next/server';
import {
  getAgentValidationManifest,
  readGuardianOnChain,
  verifyAcousticOnChain,
} from '@/lib/sonic-chain';

export async function GET() {
  return NextResponse.json(getAgentValidationManifest());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === 'status') {
      const { btcAddress } = body as { btcAddress?: string };
      if (!btcAddress) {
        return NextResponse.json({ error: 'btcAddress required' }, { status: 400 });
      }
      const status = await readGuardianOnChain(btcAddress);
      return NextResponse.json({ success: true, ...status });
    }

    if (action === 'verify_zk') {
      const { btcAddress, messageHash, signatureR, signatureS } = body as {
        btcAddress?: string;
        messageHash?: string;
        signatureR?: string;
        signatureS?: string;
      };
      if (!btcAddress || !messageHash || !signatureR || !signatureS) {
        return NextResponse.json({ error: 'Missing ZK verification fields' }, { status: 400 });
      }
      const verified = await verifyAcousticOnChain(btcAddress, messageHash, signatureR, signatureS);
      return NextResponse.json({
        success: true,
        verified,
        method: 'zk_acoustic_signature',
        message: verified
          ? 'Authorship confirmed on-chain without revealing DNA'
          : 'Signature did not match stored acoustic public key',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Chain read failed' },
      { status: 500 },
    );
  }
}
