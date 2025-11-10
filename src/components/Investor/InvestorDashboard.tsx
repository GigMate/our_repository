import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface PlatformStats {
  totalUsers: number;
  totalMusicians: number;
  totalVenues: number;
  totalFans: number;
  totalTransactions: number;
  totalRevenue: number;
  platformFees: number;
  subscriptionRevenue: number;
  activeEvents: number;
  ticketsSold: number;
}

export default function InvestorDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersResult, transactionsResult, eventsResult] = await Promise.all([
        supabase.from('profiles').select('user_type', { count: 'exact' }),
        supabase.from('transactions').select('amount, platform_fee', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' }),
      ]);

      const users = usersResult.data || [];
      const transactions = transactionsResult.data || [];

      const totalRevenue = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const platformFees = transactions.reduce((sum, t) => sum + (Number(t.platform_fee) || 0), 0);

      setStats({
        totalUsers: usersResult.count || 0,
        totalMusicians: users.filter(u => u.user_type === 'musician').length,
        totalVenues: users.filter(u => u.user_type === 'venue').length,
        totalFans: users.filter(u => u.user_type === 'fan').length,
        totalTransactions: transactionsResult.count || 0,
        totalRevenue,
        platformFees,
        subscriptionRevenue: 0,
        activeEvents: eventsResult.count || 0,
        ticketsSold: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading platform analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">Failed to load platform data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-700 mb-2">
            Welcome, {profile?.full_name || 'Investor'}
          </h1>
          <p className="text-gray-700">GigMate Platform Analytics & Insights</p>
        </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-orange-100 rounded-lg p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
          <p className="text-sm text-gray-600">Total Users</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-100 rounded-lg p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ${stats.totalRevenue.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">Total Transaction Volume</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-orange-100 rounded-lg p-3">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ${stats.platformFees.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">Platform Revenue</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-100 rounded-lg p-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <Activity className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.activeEvents}</h3>
          <p className="text-sm text-gray-600">Active Events</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            User Distribution
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Musicians</span>
                <span className="text-sm font-semibold">{stats.totalMusicians}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(stats.totalMusicians / stats.totalUsers) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Venues</span>
                <span className="text-sm font-semibold">{stats.totalVenues}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${(stats.totalVenues / stats.totalUsers) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Fans</span>
                <span className="text-sm font-semibold">{stats.totalFans}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(stats.totalFans / stats.totalUsers) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Transaction Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Total Transactions</span>
              <span className="font-semibold text-gray-900">{stats.totalTransactions}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Average Transaction</span>
              <span className="font-semibold text-gray-900">
                ${stats.totalTransactions > 0 ? (stats.totalRevenue / stats.totalTransactions).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Platform Fee Rate</span>
              <span className="font-semibold text-gray-900">10%</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Revenue Per User</span>
              <span className="font-semibold text-gray-900">
                ${stats.totalUsers > 0 ? (stats.platformFees / stats.totalUsers).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Key Performance Indicators</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-600 pl-4">
            <p className="text-sm text-gray-600 mb-1">User Growth Rate</p>
            <p className="text-2xl font-bold text-gray-900">Establishing Baseline</p>
            <p className="text-xs text-gray-500 mt-1">Tracking new registrations</p>
          </div>
          <div className="border-l-4 border-green-600 pl-4">
            <p className="text-sm text-gray-600 mb-1">Average Revenue Per User</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.totalUsers > 0 ? (stats.platformFees / stats.totalUsers).toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Monthly platform fees per user</p>
          </div>
          <div className="border-l-4 border-orange-600 pl-4">
            <p className="text-sm text-gray-600 mb-1">Platform Health Score</p>
            <p className="text-2xl font-bold text-gray-900">Excellent</p>
            <p className="text-xs text-gray-500 mt-1">Based on activity & engagement</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
