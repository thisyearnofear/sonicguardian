import { NextRequest, NextResponse } from 'next/server';

interface GuardianRecord {
  btcAddress: string;
  dnaHash: string;
  blinding: string;
  registeredAt: number;
  status: 'active' | 'recovered' | 'triggered';
}

const guardians = new Map<string, GuardianRecord>();

function isValidBtcAddress(address: string): boolean {
  const p2pkhRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const p2shRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Regex = /^(bc1)[a-z0-9]{39,87}$/;
  return p2pkhRegex.test(address) || p2shRegex.test(address) || bech32Regex.test(address);
}

async function generateDnaHash(pattern: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pattern + 'sonic-guardian-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateBlinding(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return '0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.pathname;
  
  // POST /api/agent/register
  if (url === '/api/agent/register') {
    const { btcAddress, musicalPattern, agentWalletAddress } = await request.json();
    
    if (!btcAddress || !musicalPattern) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing btcAddress or musicalPattern' 
      }, { status: 400 });
    }
    
    if (!isValidBtcAddress(btcAddress)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid Bitcoin address format' 
      }, { status: 400 });
    }
    
    const dnaHash = await generateDnaHash(musicalPattern);
    const blinding = generateBlinding();
    
    const record: GuardianRecord = {
      btcAddress,
      dnaHash,
      blinding,
      registeredAt: Date.now(),
      status: 'active'
    };
    
    guardians.set(btcAddress, record);
    
    return NextResponse.json({
      success: true,
      dnaHash,
      blinding,
      message: 'Guardian registered successfully'
    });
  }
  
  // POST /api/agent/verify
  if (url === '/api/agent/verify') {
    const { btcAddress, musicalPattern } = await request.json();
    
    const guardian = guardians.get(btcAddress);
    if (!guardian) {
      return NextResponse.json({ 
        success: false, 
        verified: false, 
        error: 'Guardian not found' 
      }, { status: 404 });
    }
    
    const providedDnaHash = await generateDnaHash(musicalPattern);
    const verified = providedDnaHash === guardian.dnaHash;
    
    return NextResponse.json({ success: true, verified });
  }
  
  // POST /api/agent/trigger
  if (url === '/api/agent/trigger') {
    const { btcAddress, musicalPattern, recipientAddress } = await request.json();
    
    const guardian = guardians.get(btcAddress);
    if (!guardian) {
      return NextResponse.json({ 
        success: false, 
        authorized: false, 
        error: 'Guardian not found' 
      }, { status: 404 });
    }
    
    const providedDnaHash = await generateDnaHash(musicalPattern);
    
    if (providedDnaHash !== guardian.dnaHash) {
      guardian.status = 'triggered';
      return NextResponse.json({ 
        success: true, 
        authorized: false, 
        error: 'Invalid musical pattern' 
      });
    }
    
    guardian.status = 'recovered';
    
    return NextResponse.json({
      success: true,
      authorized: true,
      message: 'Recovery authorized',
      recipient: recipientAddress || btcAddress
    });
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.pathname;
  
  // GET /api/agent/status/:btcAddress
  const statusMatch = url.match(/^\/api\/agent\/status\/(.+)$/);
  if (statusMatch) {
    const btcAddress = decodeURIComponent(statusMatch[1]);
    const guardian = guardians.get(btcAddress);
    
    if (!guardian) {
      return NextResponse.json({ error: 'Guardian not found' }, { status: 404 });
    }
    
    return NextResponse.json(guardian);
  }
  
  // GET /api/agent/list
  if (url === '/api/agent/list') {
    const allGuardians = Array.from(guardians.entries()).map(([addr, record]) => ({
      ...record,
      btcAddress: addr
    }));
    
    return NextResponse.json({ guardians: allGuardians, count: allGuardians.length });
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
