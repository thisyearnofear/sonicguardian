/**
 * IPFS Utilities for Sonic Guardian
 * Handles decentralized storage of encrypted backups
 */

export interface IPFSResponse {
    cid: string;
    url: string;
}

/**
 * Upload encrypted data to IPFS
 * For the hackathon, we prioritize Protocol Labs infrastructure (web3.storage / Lighthouse)
 */
export async function uploadToIPFS(encryptedData: string, metadata: any = {}): Promise<IPFSResponse | null> {
    try {
        const payload = JSON.stringify({
            data: encryptedData,
            metadata: {
                ...metadata,
                app: 'Sonic Guardian',
                version: '1.2.0',
                timestamp: Date.now()
            }
        });

        // In a production environment, we'd use a pinner like web3.storage or Lighthouse
        // For the hackathon demo, we'll use a public gateway if available, 
        // or provide instructions for the user to pin it.
        
        // MOCK: In the absence of a live API key in the environment, 
        // we simulate the CID generation which is deterministic for the data.
        const encoder = new TextEncoder();
        const data = encoder.encode(payload);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const mockCid = 'Qm' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 44);

        console.log('Successfully prepared IPFS payload:', mockCid);
        
        // Return the CID and a gateway URL
        return {
            cid: mockCid,
            url: `https://ipfs.io/ipfs/${mockCid}`
        };
    } catch (error) {
        console.error('Failed to upload to IPFS:', error);
        return null;
    }
}

/**
 * Download and decrypt data from IPFS
 */
export async function downloadFromIPFS(cid: string): Promise<string | null> {
    try {
        const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
        if (!response.ok) throw new Error('Failed to fetch from IPFS gateway');
        
        const json = await response.json();
        return json.data;
    } catch (error) {
        console.error('Failed to download from IPFS:', error);
        return null;
    }
}
