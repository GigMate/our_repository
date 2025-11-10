import { useState } from 'react';
import { Crown, MessageCircle, Star, Zap, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PremiumMessagingModalProps {
  artistId: string;
  artistName: string;
  onClose: () => void;
  onUnlocked: () => void;
}

export function PremiumMessagingModal({ artistId, artistName, onClose, onUnlocked }: PremiumMessagingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('single');

  const messagingOptions = [
    {
      id: 'single',
      name: 'Single Message',
      price: 0.99,
      description: 'Send one message to this artist',
      icon: MessageCircle,
      color: 'blue',
    },
    {
      id: '24h',
      name: '24-Hour Pass',
      price: 2.99,
      description: 'Unlimited messages for 24 hours',
      messages: 20,
      icon: Zap,
      color: 'orange',
      popular: true,
    },
    {
      id: '7day',
      name: '7-Day Pass',
      price: 9.99,
      description: 'Unlimited messages for 7 days',
      messages: 100,
      icon: Star,
      color: 'purple',
      bestValue: true,
    },
  ];

  const subscriptionTiers = [
    {
      id: 'premium',
      name: 'Fan Premium',
      price: 4.99,
      period: 'month',
      features: [
        'Message any artist directly',
        '50 artist messages per month',
        'Unlimited venue inquiries',
        'Priority in artist feeds',
        'Early event access',
      ],
      color: 'blue',
    },
    {
      id: 'vip',
      name: 'Fan VIP',
      price: 9.99,
      period: 'month',
      features: [
        'Unlimited artist messages',
        'Priority responses from artists',
        'Exclusive backstage content',
        'VIP badge on profile',
        'Free fan-to-fan messaging',
        'Early ticket access',
        'Exclusive merch discounts',
      ],
      color: 'purple',
      popular: true,
    },
  ];

  async function handlePayPerMessage() {
    setLoading(true);
    try {
      const option = messagingOptions.find(o => o.id === selectedOption);
      if (!option) return;

      const unlockType = selectedOption === 'single' ? 'single_message' :
                        selectedOption === '24h' ? 'conversation_24h' :
                        'conversation_7day';

      await supabase.rpc('unlock_artist_messaging', {
        p_fan_id: user!.id,
        p_artist_id: artistId,
        p_unlock_type: unlockType,
        p_price_cents: Math.round(option.price * 100),
      });

      onUnlocked();
    } catch (error) {
      console.error('Error unlocking messaging:', error);
      alert('Failed to unlock messaging. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscriptionUpgrade(tierId: string) {
    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ fan_messaging_tier: tierId })
        .eq('id', user!.id);

      onUnlocked();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Message {artistName}</h2>
            <p className="text-gray-600 mt-1">Choose how you'd like to connect</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Pay-Per-Message Options */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pay-Per-Message</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {messagingOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={`relative p-4 border-2 rounded-lg text-left transition-all ${
                      selectedOption === option.id
                        ? `border-${option.color}-500 bg-${option.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.popular && (
                      <div className="absolute -top-3 right-4 px-3 py-1 bg-gray-8000 text-white text-xs font-bold rounded-full">
                        POPULAR
                      </div>
                    )}
                    {option.bestValue && (
                      <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        BEST VALUE
                      </div>
                    )}

                    <div className={`inline-flex p-2 bg-${option.color}-100 rounded-lg mb-3`}>
                      <Icon className={`w-6 h-6 text-${option.color}-600`} />
                    </div>

                    <h4 className="font-bold text-gray-900 mb-1">{option.name}</h4>
                    <p className="text-2xl font-bold text-gigmate-blue mb-2">
                      ${option.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                    {option.messages && (
                      <p className="text-xs text-gray-500 mt-2">
                        Up to {option.messages} messages
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handlePayPerMessage}
              disabled={loading}
              className="mt-4 w-full px-6 py-3 bg-gigmate-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Processing...' : `Unlock for $${messagingOptions.find(o => o.id === selectedOption)?.price.toFixed(2)}`}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm font-medium text-gray-500">
                Or upgrade for unlimited access
              </span>
            </div>
          </div>

          {/* Subscription Tiers */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Subscriptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subscriptionTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative p-6 border-2 rounded-lg ${
                    tier.popular
                      ? 'border-purple-500 shadow-lg'
                      : 'border-gray-200'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-full">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {tier.name}
                        {tier.id === 'vip' && <Crown className="w-5 h-5 text-rose-500" />}
                      </h4>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gigmate-blue">
                          ${tier.price}
                        </span>
                        <span className="text-gray-600">/{tier.period}</span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className={`w-5 h-5 ${tier.popular ? 'text-purple-600' : 'text-blue-600'} flex-shrink-0 mt-0.5`} />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscriptionUpgrade(tier.id)}
                    disabled={loading}
                    className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                      tier.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {loading ? 'Processing...' : `Upgrade to ${tier.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Explanation */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-bold text-gray-900 mb-3">Why upgrade?</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-rose-500 mt-0.5" />
                <span>Direct access to your favorite artists without barriers</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-rose-500 mt-0.5" />
                <span>Higher chance of getting responses from busy musicians</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-rose-500 mt-0.5" />
                <span>Support independent artists you love</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 text-rose-500 mt-0.5" />
                <span>Build genuine connections with the music community</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
