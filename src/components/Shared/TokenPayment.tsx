import { useState, useEffect } from 'react';
import { DollarSign, Coins, ArrowLeftRight, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { formatTokenAmount, parseTokenAmount } from '../../lib/solana';

interface TokenPaymentProps {
  amountUSD: number;
  onPaymentSelect: (paymentMethod: 'usd' | 'token' | 'mixed', tokenAmount?: bigint, usdAmount?: number) => void;
  itemDescription: string;
}

interface TokenConfig {
  token_symbol: string;
  current_usd_rate: number;
  decimals: number;
  is_active: boolean;
}

export default function TokenPayment({
  amountUSD,
  onPaymentSelect,
  itemDescription
}: TokenPaymentProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'usd' | 'token' | 'mixed'>('usd');
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [tokenConfig, setTokenConfig] = useState<TokenConfig | null>(null);
  const [tokenAmount, setTokenAmount] = useState<bigint>(BigInt(0));
  const [usdAmount, setUsdAmount] = useState(amountUSD);
  const [customSplit, setCustomSplit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokenData();
  }, [user]);

  useEffect(() => {
    calculateTokenAmount();
  }, [amountUSD, tokenConfig, paymentMethod, usdAmount]);

  async function loadTokenData() {
    const [configResult, balanceResult] = await Promise.all([
      supabase.from('token_config').select('*').single(),
      supabase.from('profiles').select('gigm8_balance').eq('id', user!.id).single()
    ]);

    if (configResult.data) {
      setTokenConfig(configResult.data);
    }

    if (balanceResult.data) {
      setTokenBalance(BigInt(balanceResult.data.gigm8_balance || 0));
    }

    setLoading(false);
  }

  function calculateTokenAmount() {
    if (!tokenConfig) return;

    if (paymentMethod === 'usd') {
      setTokenAmount(BigInt(0));
      setUsdAmount(amountUSD);
    } else if (paymentMethod === 'token') {
      const amount = Math.ceil((amountUSD / tokenConfig.current_usd_rate) * Math.pow(10, tokenConfig.decimals));
      setTokenAmount(BigInt(amount));
      setUsdAmount(0);
    } else if (paymentMethod === 'mixed' && !customSplit) {
      const halfUSD = amountUSD / 2;
      const halfTokens = Math.ceil((halfUSD / tokenConfig.current_usd_rate) * Math.pow(10, tokenConfig.decimals));
      setTokenAmount(BigInt(halfTokens));
      setUsdAmount(halfUSD);
    }
  }

  function handlePaymentMethodChange(method: 'usd' | 'token' | 'mixed') {
    setPaymentMethod(method);
    setCustomSplit(false);
    onPaymentSelect(method, tokenAmount, usdAmount);
  }

  function handleMaxTokens() {
    if (!tokenConfig) return;

    const maxUSDFromTokens = Number(formatTokenAmount(tokenBalance, tokenConfig.decimals)) * tokenConfig.current_usd_rate;

    if (maxUSDFromTokens >= amountUSD) {
      setPaymentMethod('token');
      setTokenAmount(BigInt(Math.ceil((amountUSD / tokenConfig.current_usd_rate) * Math.pow(10, tokenConfig.decimals))));
      setUsdAmount(0);
    } else {
      setPaymentMethod('mixed');
      setTokenAmount(tokenBalance);
      setUsdAmount(amountUSD - maxUSDFromTokens);
      setCustomSplit(true);
    }

    onPaymentSelect('mixed', tokenBalance, amountUSD - maxUSDFromTokens);
  }

  function canAffordWithTokens(): boolean {
    if (!tokenConfig) return false;
    const requiredTokens = BigInt(Math.ceil((amountUSD / tokenConfig.current_usd_rate) * Math.pow(10, tokenConfig.decimals)));
    return tokenBalance >= requiredTokens;
  }

  function getTokenValue(): string {
    if (!tokenConfig) return '0';
    return (Number(formatTokenAmount(tokenAmount, tokenConfig.decimals)) * tokenConfig.current_usd_rate).toFixed(2);
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-600">Loading payment options...</div>;
  }

  if (!tokenConfig?.is_active) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600 text-center">Token payments coming soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Your {tokenConfig.token_symbol} Balance</span>
          <span className="text-lg font-bold text-purple-600">
            {formatTokenAmount(tokenBalance, tokenConfig.decimals)} {tokenConfig.token_symbol}
          </span>
        </div>
        <p className="text-xs text-gray-600">
          ≈ ${(Number(formatTokenAmount(tokenBalance, tokenConfig.decimals)) * tokenConfig.current_usd_rate).toFixed(2)} USD
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Payment Method</label>

        <div
          onClick={() => handlePaymentMethodChange('usd')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            paymentMethod === 'usd'
              ? 'border-blue-600 bg-gray-800'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'usd' ? 'border-blue-600' : 'border-gray-300'
              }`}>
                {paymentMethod === 'usd' && <div className="w-3 h-3 rounded-full bg-blue-600" />}
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">Pay with USD</p>
                  <p className="text-xs text-gray-600">Credit/Debit Card via Stripe</p>
                </div>
              </div>
            </div>
            <span className="text-lg font-bold text-gray-900">${amountUSD.toFixed(2)}</span>
          </div>
        </div>

        <div
          onClick={() => canAffordWithTokens() && handlePaymentMethodChange('token')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            !canAffordWithTokens()
              ? 'opacity-50 cursor-not-allowed'
              : paymentMethod === 'token'
              ? 'border-purple-600 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'token' ? 'border-purple-600' : 'border-gray-300'
              }`}>
                {paymentMethod === 'token' && <div className="w-3 h-3 rounded-full bg-purple-600" />}
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-900">Pay with {tokenConfig.token_symbol}</p>
                  <p className="text-xs text-gray-600">
                    {canAffordWithTokens() ? 'Instant payment from your balance' : 'Insufficient tokens'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-purple-600">
                {Math.ceil((amountUSD / tokenConfig.current_usd_rate))}{' '}
                {tokenConfig.token_symbol}
              </p>
              <p className="text-xs text-gray-600">≈ ${amountUSD.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => handlePaymentMethodChange('mixed')}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            paymentMethod === 'mixed'
              ? 'border-orange-600 bg-gray-800'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'mixed' ? 'border-orange-600' : 'border-gray-300'
              }`}>
                {paymentMethod === 'mixed' && <div className="w-3 h-3 rounded-full bg-orange-600" />}
              </div>
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-gray-900">Split Payment</p>
                  <p className="text-xs text-gray-600">Pay with both USD and tokens</p>
                </div>
              </div>
            </div>
            {tokenBalance > BigInt(0) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMaxTokens();
                }}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
              >
                Use Max Tokens
              </button>
            )}
          </div>

          {paymentMethod === 'mixed' && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-orange-600">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Tokens</p>
                <p className="font-bold text-purple-600">
                  {formatTokenAmount(tokenAmount, tokenConfig.decimals)} {tokenConfig.token_symbol}
                </p>
                <p className="text-xs text-gray-500">≈ ${getTokenValue()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">USD</p>
                <p className="font-bold text-green-600">${usdAmount.toFixed(2)}</p>
                <p className="text-xs text-gray-500">via Card</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {paymentMethod === 'token' && !canAffordWithTokens() && (
        <div className="flex items-start gap-2 text-orange-600 bg-gray-800 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Insufficient tokens</p>
            <p>You need {Math.ceil((amountUSD / tokenConfig.current_usd_rate))} {tokenConfig.token_symbol} but only have {formatTokenAmount(tokenBalance, tokenConfig.decimals)}. Try split payment instead.</p>
          </div>
        </div>
      )}

      <div className="bg-gray-800 border border-blue-600 rounded-lg p-3">
        <p className="text-xs text-gray-700">
          <strong>Exchange Rate:</strong> 1 {tokenConfig.token_symbol} = ${tokenConfig.current_usd_rate.toFixed(4)} USD
        </p>
      </div>
    </div>
  );
}
