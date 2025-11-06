import { useState, useEffect } from 'react';
import { TrendingUp, Star, Users, Award, BarChart3, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function RatingAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();

    setUserProfile(data);
    checkAccess(data);
  };

  const checkAccess = async (profile: any) => {
    let access = false;

    if (profile.user_type === 'musician') {
      access = profile.tier_level === 'platinum';
    } else if (profile.user_type === 'venue') {
      access = profile.venue_subscription_tier === 'national';
    } else if (profile.user_type === 'fan') {
      access = profile.fan_subscription_tier === 'vip';
    }

    setHasAccess(access);

    if (access) {
      await loadAnalytics(profile);
    }

    setLoading(false);
  };

  const loadAnalytics = async (profile: any) => {
    const { data: ratingsReceived } = await supabase
      .from('ratings')
      .select('rating, category, created_at')
      .eq('rated_user_id', user?.id);

    const { data: ratingsGiven } = await supabase
      .from('ratings')
      .select('rating, created_at')
      .eq('rater_id', user?.id);

    if (ratingsReceived && ratingsGiven) {
      const analytics = calculateAnalytics(ratingsReceived, ratingsGiven);
      setAnalytics(analytics);
    }
  };

  const calculateAnalytics = (received: any[], given: any[]) => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentReceived = received.filter(r => new Date(r.created_at) > last30Days);
    const recentGiven = given.filter(r => new Date(r.created_at) > last30Days);

    const avgRating = received.length > 0
      ? received.reduce((sum, r) => sum + r.rating, 0) / received.length
      : 0;

    const categoryBreakdown: Record<string, { total: number; count: number }> = {};
    received.forEach(r => {
      if (!categoryBreakdown[r.category]) {
        categoryBreakdown[r.category] = { total: 0, count: 0 };
      }
      categoryBreakdown[r.category].total += r.rating;
      categoryBreakdown[r.category].count += 1;
    });

    const categoryAverages = Object.entries(categoryBreakdown).map(([category, data]) => ({
      category,
      average: data.total / data.count,
      count: data.count
    }));

    const monthlyTrend: Record<string, number> = {};
    received.forEach(r => {
      const month = new Date(r.created_at).toISOString().slice(0, 7);
      monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
    });

    return {
      totalReceived: received.length,
      totalGiven: given.length,
      averageRating: avgRating,
      recentReceivedCount: recentReceived.length,
      recentGivenCount: recentGiven.length,
      categoryAverages,
      monthlyTrend,
      highestCategory: categoryAverages.sort((a, b) => b.average - a.average)[0],
      lowestCategory: categoryAverages.sort((a, b) => a.average - b.average)[0]
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-8 text-center">
          <Lock className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Premium Analytics Locked
          </h2>
          <p className="text-gray-700 mb-6">
            Upgrade to unlock detailed rating analytics and insights!
          </p>

          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            {userProfile?.user_type === 'musician' && (
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 mb-2">Platinum Musicians</h3>
                <p className="text-sm text-gray-600">Earn through 50+ ratings with 4.5+ average</p>
              </div>
            )}
            {userProfile?.user_type === 'venue' && (
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 mb-2">National Venues</h3>
                <p className="text-sm text-gray-600">$199.99/month subscription</p>
              </div>
            )}
            {userProfile?.user_type === 'fan' && (
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900 mb-2">VIP Fans</h3>
                <p className="text-sm text-gray-600">$9.99/month subscription</p>
              </div>
            )}
          </div>

          <button className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No rating data available yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Rating Analytics</h1>
        <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
          <Award className="h-5 w-5" />
          <span className="font-semibold">Premium Access</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Star}
          label="Average Rating"
          value={analytics.averageRating.toFixed(2)}
          subtext={`${analytics.totalReceived} total ratings`}
          color="yellow"
        />
        <StatCard
          icon={TrendingUp}
          label="Recent Activity"
          value={analytics.recentReceivedCount}
          subtext="Ratings in last 30 days"
          color="green"
        />
        <StatCard
          icon={Users}
          label="Ratings Given"
          value={analytics.totalGiven}
          subtext={`${analytics.recentGivenCount} in last 30 days`}
          color="blue"
        />
        <StatCard
          icon={Award}
          label="Best Category"
          value={analytics.highestCategory?.average.toFixed(1) || 'N/A'}
          subtext={analytics.highestCategory?.category.replace(/_/g, ' ') || 'None'}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Category Breakdown
          </h3>
          <div className="space-y-4">
            {analytics.categoryAverages.map((cat: any) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {cat.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {cat.average.toFixed(2)} ({cat.count})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                    style={{ width: `${(cat.average / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-600" />
            Monthly Trend
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.monthlyTrend)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, ((count as number) / Math.max(...Object.values(analytics.monthlyTrend))) * 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {analytics.lowestCategory && analytics.lowestCategory.average < 4 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-900 mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Improvement Opportunity
          </h3>
          <p className="text-yellow-800">
            Your <strong>{analytics.lowestCategory.category.replace(/_/g, ' ')}</strong> category has the lowest average rating of{' '}
            <strong>{analytics.lowestCategory.average.toFixed(2)}</strong>. Consider focusing on this area to improve your overall rating.
          </p>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  subtext: string;
  color: 'yellow' | 'green' | 'blue' | 'purple';
}

function StatCard({ icon: Icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses = {
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-300 text-yellow-700',
    green: 'from-green-50 to-green-100 border-green-300 text-green-700',
    blue: 'from-blue-50 to-blue-100 border-blue-300 text-blue-700',
    purple: 'from-purple-50 to-purple-100 border-purple-300 text-purple-700',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border-2 rounded-lg p-6`}>
      <Icon className="h-8 w-8 mb-3" />
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-600">{subtext}</p>
    </div>
  );
}
