import { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, DollarSign, TrendingUp, Share2, Mail, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ReferralStats {
  totalReferrals: number;
  totalCredits: number;
  pendingReferrals: number;
  convertedReferrals: number;
}

interface Referral {
  id: string;
  referee_type: string;
  status: string;
  conversion_date: string | null;
  reward_credits: number;
  credits_awarded: boolean;
  created_at: string;
}

export default function ReferralProgram() {
  const { profile } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalCredits: 0,
    pendingReferrals: 0,
    convertedReferrals: 0,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadReferralData();
    }
  }, [profile]);

  async function loadReferralData() {
    if (!profile) return;

    try {
      // Get referral code
      setReferralCode(profile.referral_code || '');

      // Get referral statistics
      const { data: referralData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', profile.id);

      if (referralData) {
        const converted = referralData.filter(r => r.status === 'converted');
        const pending = referralData.filter(r => r.status === 'pending');
        const totalCredits = referralData.reduce((sum, r) => sum + (Number(r.reward_credits) || 0), 0);

        setStats({
          totalReferrals: referralData.length,
          totalCredits,
          pendingReferrals: pending.length,
          convertedReferrals: converted.length,
        });

        setReferrals(referralData);
      }

      // Update profile stats if they don't match
      if (profile.total_referrals !== referralData?.length ||
          profile.referral_credits !== stats.totalCredits) {
        await supabase
          .from('profiles')
          .update({
            total_referrals: referralData?.length || 0,
            referral_credits: stats.totalCredits,
          })
          .eq('id', profile.id);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  }

  function copyReferralCode() {
    const referralUrl = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareViaEmail() {
    const subject = encodeURIComponent('Join GigMate - Connect with Live Music!');
    const body = encodeURIComponent(
      `Hey! I've been using GigMate to ${
        profile?.user_type === 'musician' ? 'find gigs and grow my fanbase' :
        profile?.user_type === 'venue' ? 'book amazing musicians' :
        'discover live music events'
      }. You should check it out!\n\nJoin here: ${window.location.origin}?ref=${referralCode}\n\nYou'll love it!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function shareViaSMS() {
    const message = encodeURIComponent(
      `Check out GigMate! ${window.location.origin}?ref=${referralCode}`
    );
    window.location.href = `sms:?body=${message}`;
  }

  const rewardAmount = profile?.user_type === 'venue' ? 50 : 25;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 rounded-full p-3">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Refer & Earn Credits!</h2>
              <p className="text-green-50">Share GigMate and earn ${rewardAmount} in credits per referral</p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-green-50 mb-2">
                Your Personal Referral Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}?ref=${referralCode}`}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white/90 text-gray-900 rounded-lg font-mono text-sm"
                />
                <button
                  onClick={copyReferralCode}
                  className="px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={shareViaEmail}
                className="flex-1 px-4 py-3 bg-white/90 hover:bg-white text-green-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Email
              </button>
              <button
                onClick={shareViaSMS}
                className="flex-1 px-4 py-3 bg-white/90 hover:bg-white text-green-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Text
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Join GigMate',
                      text: 'Connect with live music on GigMate!',
                      url: `${window.location.origin}?ref=${referralCode}`,
                    });
                  }
                }}
                className="flex-1 px-4 py-3 bg-white/90 hover:bg-white text-green-600 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-gray-700 rounded-lg p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</div>
          <div className="text-sm text-gray-600">Total Referrals</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">${stats.totalCredits.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Credits Earned</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-rose-100 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.pendingReferrals}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 rounded-lg p-3">
              <Check className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.convertedReferrals}</div>
          <div className="text-sm text-gray-600">Converted</div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-green-600">1</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Share Your Link</h4>
            <p className="text-sm text-gray-600">
              Send your unique referral link to friends, family, or fellow music lovers
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">They Sign Up</h4>
            <p className="text-sm text-gray-600">
              When they create an account using your link, you're automatically credited
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Earn Credits</h4>
            <p className="text-sm text-gray-600">
              Get ${rewardAmount} in credits for each successful referral. Use at any GigMate event!
            </p>
          </div>
        </div>
      </div>

      {/* Referral History */}
      {referrals.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Referrals</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Awarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-700 text-blue-800">
                        {referral.referee_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        referral.status === 'converted' ? 'bg-green-100 text-green-800' :
                        referral.status === 'pending' ? 'bg-rose-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                      ${Number(referral.reward_credits).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {referral.credits_awarded ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <span className="text-sm text-gray-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pro Tips */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-300">
        <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Pro Tips for More Referrals</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Share your link on social media with a personal story about GigMate</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Add your referral link to your email signature</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Tell other {profile?.user_type === 'musician' ? 'musicians' : profile?.user_type === 'venue' ? 'venue owners' : 'music fans'} at local events</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Post about specific events or features you love</span>
          </li>
        </ul>
      </div>

      {/* How Credits Work */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-300">
        <h3 className="text-lg font-bold text-gray-900 mb-3">🎟️ How Your Credits Work</h3>
        <p className="text-sm text-gray-700 mb-3">
          <strong>Credits = Dollars!</strong> Your referral credits have real dollar value and can be used to buy tickets at any GigMate event.
        </p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>1 Credit = $1 Value</strong> - Use them just like cash at events</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Event Tickets Only</strong> - Redeemable at GigMate.us events</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>No Expiration</strong> - Keep earning and use them whenever you want</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Partial or Full Payment</strong> - Use some or all of your credits per purchase</span>
          </li>
        </ul>
        <div className="mt-4 p-3 bg-white rounded-lg border border-green-300">
          <p className="text-xs text-gray-600 text-center">
            💡 <strong>Example:</strong> You have $50 in credits and tickets cost $40. You can use $40 in credits and pay $0, or save your credits for later!
          </p>
        </div>
      </div>
    </div>
  );
}
