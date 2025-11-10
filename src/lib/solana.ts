export interface SolanaWallet {
  publicKey: { toString: () => string };
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface WalletProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  solana?: SolanaWallet;
}

declare global {
  interface Window {
    solana?: SolanaWallet;
    phantom?: { solana?: SolanaWallet };
    solflare?: SolanaWallet;
  }
}

export function getWalletProvider(): SolanaWallet | null {
  if (typeof window === 'undefined') return null;

  if (window.phantom?.solana?.isPhantom) {
    return window.phantom.solana;
  }

  if (window.solflare) {
    return window.solflare;
  }

  if (window.solana) {
    return window.solana;
  }

  return null;
}

export async function connectWallet(): Promise<string | null> {
  const provider = getWalletProvider();

  if (!provider) {
    throw new Error('No Solana wallet found. Please install Phantom or Solflare.');
  }

  try {
    await provider.connect();
    return provider.publicKey.toString();
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw new Error('Failed to connect wallet');
  }
}

export async function disconnectWallet(): Promise<void> {
  const provider = getWalletProvider();

  if (provider) {
    try {
      await provider.disconnect();
    } catch (error) {
      console.error('Wallet disconnect error:', error);
    }
  }
}

export function isWalletInstalled(): boolean {
  return !!getWalletProvider();
}

export function getWalletName(): string {
  if (typeof window === 'undefined') return 'Unknown';

  if (window.phantom?.solana?.isPhantom) return 'Phantom';
  if (window.solflare) return 'Solflare';
  if (window.solana) return 'Solana';

  return 'Unknown';
}

export function formatTokenAmount(amount: bigint, decimals: number = 9): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
  return `${whole}.${fractionStr}`;
}

export function parseTokenAmount(amount: string, decimals: number = 9): bigint {
  const [whole, fraction = '0'] = amount.split('.');
  const fractionPadded = fraction.padEnd(decimals, '0').slice(0, decimals);
  const combined = whole + fractionPadded;
  return BigInt(combined);
}

export async function verifyWalletOwnership(
  walletAddress: string,
  message: string
): Promise<boolean> {
  const provider = getWalletProvider();

  if (!provider) {
    throw new Error('No wallet found');
  }

  if (provider.publicKey.toString() !== walletAddress) {
    throw new Error('Wallet address mismatch');
  }

  try {
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await provider.signMessage(encodedMessage);
    return signature.length > 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
