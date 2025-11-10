import { useState, useEffect } from 'react';
import { Wallet, AlertCircle, CheckCircle, X, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  connectWallet,
  disconnectWallet,
  isWalletInstalled,
  getWalletName,
  verifyWalletOwnership
} from '../../lib/solana';

interface WalletConnection {
  id: string;
  wallet_address: string;
  wallet_type: string;
  is_primary: boolean;
  verified: boolean;
  created_at: string;
}

export default function WalletConnector() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletConnection[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadWallets();
    }
  }, [user]);

  async function loadWallets() {
    const { data, error } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading wallets:', error);
    } else {
      setWallets(data || []);
    }
  }

  async function handleConnect() {
    if (!user) return;

    setConnecting(true);
    setError('');
    setSuccess('');

    try {
      if (!isWalletInstalled()) {
        throw new Error('No Solana wallet detected. Please install Phantom or Solflare.');
      }

      const walletAddress = await connectWallet();
      if (!walletAddress) {
        throw new Error('Failed to connect wallet');
      }

      const { data: existing } = await supabase
        .from('wallet_connections')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (existing) {
        throw new Error('This wallet is already connected');
      }

      const verificationMessage = `GigMate Wallet Verification\nUser ID: ${user.id}\nTimestamp: ${Date.now()}`;
      const verified = await verifyWalletOwnership(walletAddress, verificationMessage);

      const isPrimary = wallets.length === 0;

      const { error: insertError } = await supabase
        .from('wallet_connections')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress,
          wallet_type: getWalletName().toLowerCase(),
          is_primary: isPrimary,
          verified: verified,
          last_used_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      setSuccess('Wallet connected successfully!');
      await loadWallets();

      setTimeout(() => {
        setSuccess('');
        setShowModal(false);
      }, 2000);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(walletId: string) {
    if (!confirm('Disconnect this wallet?')) return;

    const { error } = await supabase
      .from('wallet_connections')
      .delete()
      .eq('id', walletId);

    if (error) {
      console.error('Error disconnecting wallet:', error);
      return;
    }

    await loadWallets();
    await disconnectWallet();
  }

  async function setPrimary(walletId: string) {
    await supabase
      .from('wallet_connections')
      .update({ is_primary: false })
      .eq('user_id', user!.id);

    const { error } = await supabase
      .from('wallet_connections')
      .update({ is_primary: true })
      .eq('id', walletId);

    if (error) {
      console.error('Error setting primary wallet:', error);
      return;
    }

    await loadWallets();
  }

  function formatAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        <Wallet className="w-4 h-4" />
        {wallets.length > 0 ? 'Manage Wallets' : 'Connect Wallet'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Solana Wallets</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-gray-700">
                  Connect your Solana wallet to pay with GigM8 tokens and receive token rewards.
                  We support Phantom, Solflare, and other Solana wallets.
                </p>
              </div>
            </div>

            {wallets.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="font-semibold text-gray-900">Connected Wallets</h3>
                {wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-900">
                            {formatAddress(wallet.wallet_address)}
                          </span>
                          {wallet.verified && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {wallet.is_primary && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 capitalize">{wallet.wallet_type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!wallet.is_primary && (
                        <button
                          onClick={() => setPrimary(wallet.id)}
                          className="text-sm text-purple-600 hover:text-purple-700"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => handleDisconnect(wallet.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isWalletInstalled() && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 mb-2">No Wallet Detected</p>
                    <p className="text-sm text-yellow-800 mb-3">
                      Install a Solana wallet to continue:
                    </p>
                    <div className="flex gap-3">
                      <a
                        href="https://phantom.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        Install Phantom
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <a
                        href="https://solflare.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                      >
                        Install Solflare
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm">{success}</p>
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={connecting || !isWalletInstalled()}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {connecting ? 'Connecting...' : 'Connect New Wallet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
