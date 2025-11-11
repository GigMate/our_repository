import { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown, History, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatTokenAmount } from '../../lib/solana';

interface TokenStats {
  balance: bigint;
  earned: bigint;
  spent: bigint;
}

interface TokenTransaction {
  id: string;
  amount: bigint;
  transaction_type: string;
  created_at: string;
  from_user_id: string | null;
  to_user_id: string | null;
  usd_value_at_transaction: number;
}

interface TokenConfig {
  token_symbol: string;
  current_usd_rate: number;
  decimals: number;
}

export default function TokenBalanceDisplay() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TokenStats>({
    balance: BigInt(0),
    earned: BigInt(0),
    spent: BigInt(0)
  });
  const [config, setConfig] = useState<TokenConfig | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    const [profileData, configData, txData] = await Promise.all([
      supabase
        .from('profiles')
        .select('gigm8_balance, gigm8_earned_total, gigm8_spent_total')
        .eq('id', user!.id)
        .single(),
      supabase.from('token_config').select('*').single(),
      supabase
        .from('token_transactions')
        .select('*')
        .or(`from_user_id.eq.${user!.id},to_user_id.eq.${user!.id}`)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    if (profileData.data) {
      setStats({
        balance: BigInt(profileData.data.gigm8_balance || 0),
        earned: BigInt(profileData.data.gigm8_earned_total || 0),
        spent: BigInt(profileData.data.gigm8_spent_total || 0)
      });
    }

    if (configData.data) {
      setConfig(configData.data);
    }

    if (txData.data) {
      setTransactions(txData.data);
    }

    setLoading(false);
  }

  function getUSDValue(amount: bigint): string {
    if (!config) return '0.00';
    return (Number(formatTokenAmount(amount, config.decimals)) * config.current_usd_rate).toFixed(2);
  }

  function formatTransactionType(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function getTransactionIcon(type: string) {
    if (type.includes('reward') || type.includes('grant')) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  }

  if (loading || !config) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6" />
            <span className="text-sm font-semibold opacity-90">Your {config.token_symbol} Balance</span>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-sm hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded-full transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-3xl font-bold">
              {formatTokenAmount(stats.balance, config.decimals)} {config.token_symbol}
            </p>
            <p className="text-sm opacity-80">≈ ${getUSDValue(stats.balance)} USD</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white border-opacity-20">
            <div>
              <p className="text-xs opacity-70 mb-1">Total Earned</p>
              <p className="font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {formatTokenAmount(stats.earned, config.decimals)}
              </p>
              <p className="text-xs opacity-70">${getUSDValue(stats.earned)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70 mb-1">Total Spent</p>
              <p className="font-semibold flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                {formatTokenAmount(stats.spent, config.decimals)}
              </p>
              <p className="text-xs opacity-70">${getUSDValue(stats.spent)}</p>
            </div>
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4">Transaction History</h3>

          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isReceived = tx.to_user_id === user!.id;
                const amount = BigInt(tx.amount);

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(tx.transaction_type)}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {formatTransactionType(tx.transaction_type)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString()} at{' '}
                          {new Date(tx.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`font-bold ${isReceived ? 'text-green-600' : 'text-red-600'}`}>
                        {isReceived ? '+' : '-'}
                        {formatTokenAmount(amount, config.decimals)} {config.token_symbol}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${tx.usd_value_at_transaction?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-800 border border-cyan-400 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <ArrowUpRight className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-100">
            <p className="font-semibold text-white mb-1">Earn More Tokens</p>
            <ul className="space-y-1 text-xs">
              <li>• Refer friends: Up to 50 {config.token_symbol}</li>
              <li>• Attend events: Token rewards</li>
              <li>• Book musicians: Earn loyalty tokens</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
