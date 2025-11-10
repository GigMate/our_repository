import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Target, Zap, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  averageLTV: number;
  conversionRate: number;
  recommendationEffectiveness: number;
  topSpenders: any[];
  revenueByCategory: any[];
  userSegments: any[];
  purchasePredictions: any[];
}

export function RevenueAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);

    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        { count: totalUsers },
        { count: activeUsers },
        { data: purchases },
        { data: recommendations },
        { data: userPrefs },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_behavior_events')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString()),
        supabase.from('purchase_patterns')
          .select('*')
          .gte('created_at', startDate.toISOString()),
        supabase.from('recommendation_clicks')
          .select('*, recommendation:recommendation_queue(*)')
          .gte('created_at', startDate.toISOString()),
        supabase.from('user_preferences')
          .select('*')
          .order('likelihood_to_purchase', { ascending: false })
          .limit(10),
      ]);

      const totalRevenue = purchases?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const averageLTV = totalRevenue / Math.max(totalUsers || 1, 1);

      const convertedRecs = recommendations?.filter(r => r.converted) || [];
      const conversionRate = recommendations?.length
        ? (convertedRecs.length / recommendations.length) * 100
        : 0;

      const revenueFromRecs = convertedRecs.reduce((sum, r) => sum + (r.conversion_value || 0), 0);
      const recommendationEffectiveness = totalRevenue > 0
        ? (revenueFromRecs / totalRevenue) * 100
        : 0;

      const purchasesByType = purchases?.reduce((acc: any, p) => {
        acc[p.purchase_type] = (acc[p.purchase_type] || 0) + p.amount;
        return acc;
      }, {});

      const revenueByCategory = Object.entries(purchasesByType || {}).map(([type, amount]) => ({
        category: type,
        revenue: amount,
      }));

      const userSegments = [
        { segment: 'High Value (>$500)', count: purchases?.filter(p => p.total_lifetime_value > 500).length || 0 },
        { segment: 'Medium Value ($100-$500)', count: purchases?.filter(p => p.total_lifetime_value >= 100 && p.total_lifetime_value <= 500).length || 0 },
        { segment: 'Low Value (<$100)', count: purchases?.filter(p => p.total_lifetime_value < 100).length || 0 },
      ];

      setAnalytics({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalRevenue,
        averageLTV,
        conversionRate,
        recommendationEffectiveness,
        topSpenders: userPrefs || [],
        revenueByCategory,
        userSegments,
        purchasePredictions: userPrefs || [],
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setLoading(true);
    try {
      await supabase.rpc('analyze_user_preferences');
      await supabase.rpc('generate_revenue_recommendations');

      alert('Analysis complete! New recommendations generated.');
      await loadAnalytics();
    } catch (error: any) {
      console.error('Analysis error:', error);
      alert('Analysis failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gigmate-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Revenue Analytics & AI Insights</h2>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gigmate-blue"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-gigmate-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Run AI Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Users</span>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.totalUsers.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">{analytics.activeUsers} active</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${analytics.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">In selected period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Avg LTV</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${analytics.averageLTV.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Per user</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">AI Effectiveness</span>
            <Target className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.recommendationEffectiveness.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Revenue from AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gigmate-blue" />
            Revenue by Category
          </h3>
          <div className="space-y-3">
            {analytics.revenueByCategory.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{cat.category}</span>
                  <span className="text-sm font-bold text-gray-900">${cat.revenue.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gigmate-blue h-2 rounded-full"
                    style={{ width: `${(cat.revenue / analytics.totalRevenue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gigmate-blue" />
            User Segments
          </h3>
          <div className="space-y-4">
            {analytics.userSegments.map((segment) => (
              <div key={segment.segment} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{segment.segment}</span>
                <span className="text-lg font-bold text-gigmate-blue">{segment.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-gigmate-blue" />
          High-Value User Predictions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Purchase Likelihood</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Engagement Score</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Spending Tier</th>
              </tr>
            </thead>
            <tbody>
              {analytics.purchasePredictions.slice(0, 10).map((user) => (
                <tr key={user.user_id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">{user.user_id.substring(0, 8)}...</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(user.likelihood_to_purchase || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {((user.likelihood_to_purchase || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {(user.engagement_score || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.spending_tier === 'luxury' ? 'bg-purple-100 text-purple-800' :
                      user.spending_tier === 'premium' ? 'bg-orange-100 text-blue-800' :
                      user.spending_tier === 'moderate' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.spending_tier || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
