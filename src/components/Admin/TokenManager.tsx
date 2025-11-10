import { useState, useEffect } from 'react';
import { Settings, DollarSign, Save, AlertCircle, CheckCircle, TrendingUp, Users, Coins } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TokenConfig {
  id: string;
  token_name: string;
  token_symbol: string;
  contract_address: string | null;
  decimals: number;
  current_usd_rate: number;
  treasury_wallet_address: string | null;
  rewards_wallet_address: string | null;
  is_active: boolean;
  total_supply: number | null;
  circulating_supply: number;
}

interface TokenStats {
  total_users_with_balance: number;
  total_circulating: bigint;
  total_transactions: number;
  total_volume_usd: number;
}

export default function TokenManager() {
  const [config, setConfig] = useState<TokenConfig | null>(null);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: configData } = await supabase
      .from('token_config')
      .select('*')
      .single();

    if (configData) {
      setConfig(configData);
    }

    const [usersResult, txResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('gigm8_balance')
        .gt('gigm8_balance', 0),
      supabase
        .from('token_transactions')
        .select('amount, usd_value_at_transaction')
    ]);

    if (usersResult.data && txResult.data) {
      const totalCirculating = usersResult.data.reduce(
        (sum, u) => sum + BigInt(u.gigm8_balance || 0),
        BigInt(0)
      );

      const totalVolume = txResult.data.reduce(
        (sum, tx) => sum + (tx.usd_value_at_transaction || 0),
        0
      );

      setStats({
        total_users_with_balance: usersResult.data.length,
        total_circulating: totalCirculating,
        total_transactions: txResult.data.length,
        total_volume_usd: totalVolume
      });
    }
  }

  async function handleSave() {
    if (!config) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('token_config')
        .update({
          token_name: config.token_name,
          token_symbol: config.token_symbol,
          contract_address: config.contract_address,
          decimals: config.decimals,
          current_usd_rate: config.current_usd_rate,
          treasury_wallet_address: config.treasury_wallet_address,
          rewards_wallet_address: config.rewards_wallet_address,
          is_active: config.is_active,
          total_supply: config.total_supply,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (updateError) throw updateError;

      if (config.current_usd_rate) {
        await supabase
          .from('token_exchange_rates')
          .insert({
            rate: config.current_usd_rate,
            source: 'manual'
          });
      }

      setSuccess('Token configuration saved successfully!');
      await loadData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Coins className="w-7 h-7 text-purple-600" />
          Token Management
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-semibold">Token Holders</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_users_with_balance}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5" />
              <span className="text-sm font-semibold">Circulating</span>
            </div>
            <p className="text-2xl font-bold">
              {(Number(stats.total_circulating) / 1000000000).toFixed(0)}
            </p>
            <p className="text-xs opacity-80">{config.token_symbol}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-semibold">Transactions</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_transactions}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-semibold">Volume (USD)</span>
            </div>
            <p className="text-2xl font-bold">${stats.total_volume_usd.toFixed(0)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900">Token Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Token Name
            </label>
            <input
              type="text"
              value={config.token_name}
              onChange={(e) => setConfig({ ...config, token_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Token Symbol
            </label>
            <input
              type="text"
              value={config.token_symbol}
              onChange={(e) => setConfig({ ...config, token_symbol: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contract Address (Solana)
            </label>
            <input
              type="text"
              value={config.contract_address || ''}
              onChange={(e) => setConfig({ ...config, contract_address: e.target.value })}
              placeholder="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Decimals
            </label>
            <input
              type="number"
              value={config.decimals}
              onChange={(e) => setConfig({ ...config, decimals: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current USD Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <input
                type="number"
                step="0.0001"
                value={config.current_usd_rate}
                onChange={(e) => setConfig({ ...config, current_usd_rate: parseFloat(e.target.value) })}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">1 {config.token_symbol} = ${config.current_usd_rate} USD</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Total Supply
            </label>
            <input
              type="number"
              value={config.total_supply || ''}
              onChange={(e) => setConfig({ ...config, total_supply: parseInt(e.target.value) })}
              placeholder="100000000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Treasury Wallet Address
            </label>
            <input
              type="text"
              value={config.treasury_wallet_address || ''}
              onChange={(e) => setConfig({ ...config, treasury_wallet_address: e.target.value })}
              placeholder="Solana wallet address for treasury"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rewards Wallet Address
            </label>
            <input
              type="text"
              value={config.rewards_wallet_address || ''}
              onChange={(e) => setConfig({ ...config, rewards_wallet_address: e.target.value })}
              placeholder="Solana wallet address for rewards distribution"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <input
            type="checkbox"
            id="is_active"
            checked={config.is_active}
            onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
          />
          <label htmlFor="is_active" className="font-semibold text-gray-900">
            Enable Token Payments
          </label>
        </div>

        {!config.is_active && (
          <div className="bg-rose-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Token payments are currently disabled. Enable them to allow users to pay with {config.token_symbol}.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}
