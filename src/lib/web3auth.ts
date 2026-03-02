/**
 * Web3Auth Integration for Starknet
 * Client-side social login with no backend required
 */

import { Web3Auth, WEB3AUTH_NETWORK, IProvider } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { Account, RpcProvider, ec } from "starknet";

const STARKNET_SEPOLIA_CHAIN_ID = "0x534e5f5345504f4c4941"; // SN_SEPOLIA

let web3auth: Web3Auth | null = null;

export interface SocialLoginResult {
  address: string;
  provider: string;
  status: 'connected';
  email?: string;
  account: Account;
}

/**
 * Initialize Web3Auth (call once on app load)
 */
export async function initWeb3Auth(): Promise<void> {
  if (web3auth) return;

  try {
    web3auth = new Web3Auth({
      clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "demo-client-id",
      web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    });

    await web3auth.init();
  } catch (error) {
    console.error("Web3Auth initialization failed:", error);
    throw error;
  }
}

/**
 * Social login with Web3Auth
 */
export async function socialLogin(provider: 'google' | 'apple'): Promise<SocialLoginResult> {
  if (!web3auth) {
    await initWeb3Auth();
  }

  if (!web3auth) {
    throw new Error("Web3Auth not initialized");
  }

  try {
    const web3authProvider = await web3auth.connect();
    
    if (!web3authProvider) {
      throw new Error("Failed to connect to Web3Auth");
    }

    // Get private key from Web3Auth
    const privateKey = await getPrivateKey(web3authProvider);
    
    // Derive Starknet address
    const starkKeyPair = ec.starkCurve.getStarkKey(privateKey);
    const address = `0x${starkKeyPair}`;

    // Create Starknet account
    const rpcProvider = new RpcProvider({
      nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
    });

    const account = new Account({
      provider: rpcProvider,
      address,
      signer: privateKey,
    });

    // Get user info
    const userInfo = await web3auth.getUserInfo();

    return {
      address,
      provider,
      status: 'connected',
      email: userInfo.email,
      account,
    };
  } catch (error) {
    console.error("Social login failed:", error);
    throw new Error("Failed to authenticate with social provider");
  }
}

/**
 * Logout from Web3Auth
 */
export async function logout(): Promise<void> {
  if (!web3auth) return;
  
  try {
    await web3auth.logout();
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

/**
 * Get private key from Web3Auth provider
 */
async function getPrivateKey(provider: IProvider): Promise<string> {
  try {
    const privateKey = await provider.request({
      method: "private_key",
    });
    
    if (typeof privateKey !== "string") {
      throw new Error("Invalid private key format");
    }
    
    return privateKey;
  } catch (error) {
    console.error("Failed to get private key:", error);
    throw error;
  }
}

/**
 * Check if user is connected
 */
export function isConnected(): boolean {
  return web3auth?.connected ?? false;
}
