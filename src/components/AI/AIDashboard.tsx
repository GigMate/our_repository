import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Brain, TrendingUp, Users, Zap, AlertCircle, CheckCircle, Clock, Target, BarChart3, Settings, RefreshCw } from 'lucide-react';

interface AIStats {
  totalLeads: number;
  convertedLeads: number;
  activeStrategies: number;
  activeCampaigns: number;
  marketIntelligence: number;
  operationsToday: number;
}

interface LeadProspect {
  id: string;
  prospect_type: string;
  name: string;
  business_name: string | null;
  location_city: string | null;
  location_state: string | null;
  lead_score: number;
  contact_status: string;
  discovery_date: string;
}

interface MarketIntelligence {
  id: string;
  intelligence_type: string;
  title: string;
  summary: string;
  relevance_score: number;
  sentiment: string;
  status: string;
  discovered_date: string;
}

interface MarketingStrategy {
  id: string;
  strategy_name: string;
  strategy_type: string;
  priority: string;
  status: string;
  projected_roi: number | null;
  created_at: string;
}

export default function AIDashboard() {
  const [stats, setStats] = useState<AIStats>({
    totalLeads: 0,
    convertedLeads: 0,
    activeStrategies: 0,
    activeCampaigns: 0,
    marketIntelligence: 0,
    operationsToday: 0,
  });
  const [recentLeads, setRecentLeads] = useState<LeadProspect[]>([]);
  const [intelligence, setIntelligence] = useState<MarketIntelligence[]>([]);
  const [strategies, setStrategies] = useState<MarketingStrategy[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'intelligence' | 'strategies' | 'config'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [
        leadsResult,
        intelligenceResult,
        strategiesResult,
        campaignsResult,
        operationsResult,
      ] = await Promise.all([
        supabase.from('ai_lead_prospects').select('*').order('discovery_date', { ascending: false }).limit(10),
        supabase.from('ai_market_intelligence').select('*').eq('status', 'new').order('discovered_date', { ascending: false }).limit(10),
        supabase.from('ai_marketing_strategies').select('*').in('status', ['proposed', 'approved', 'in_progress']).order('created_at', { ascending: false }),
        supabase.from('ai_outreach_campaigns').select('*', { count: 'exact', head: true }).in('status', ['active', 'scheduled']),
        supabase.from('ai_operations_log').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const totalLeadsCount = await supabase.from('ai_lead_prospects').select('*', { count: 'exact', head: true });
      const convertedLeadsCount = await supabase.from('ai_lead_prospects').select('*', { count: 'exact', head: true }).eq('contact_status', 'converted');
      const allIntelligenceCount = await supabase.from('ai_market_intelligence').select('*', { count: 'exact', head: true });

      setStats({
        totalLeads: totalLeadsCount.count || 0,
        convertedLeads: convertedLeadsCount.count || 0,
        activeStrategies: strategiesResult.data?.length || 0,
        activeCampaigns: campaignsResult.count || 0,
        marketIntelligence: allIntelligenceCount.count || 0,
        operationsToday: operationsResult.count || 0,
      });

      setRecentLeads(leadsResult.data || []);
      setIntelligence(intelligenceResult.data || []);
      setStrategies(strategiesResult.data || []);
    } catch (error) {
      console.error('Error loading AI dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const conversionRate = stats.totalLeads > 0 ? ((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-10 h-10" />
                <h1 className="text-4xl font-bold">AI Operations Center</h1>
              </div>
              <p className="text-purple-100 text-lg">
                Autonomous marketing intelligence and lead generation system
              </p>
            </div>
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total Leads</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalLeads}</div>
            <div className="text-sm text-green-600 mt-2">
              {stats.convertedLeads} converted ({conversionRate}%)
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Market Intel</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.marketIntelligence}</div>
            <div className="text-sm text-gray-600 mt-2">Actionable insights</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Strategies</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.activeStrategies}</div>
            <div className="text-sm text-gray-600 mt-2">Active & proposed</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Operations</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.operationsToday}</div>
            <div className="text-sm text-gray-600 mt-2">Last 24 hours</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'leads', label: 'Lead Prospects', icon: Users },
                { id: 'intelligence', label: 'Market Intelligence', icon: TrendingUp },
                { id: 'strategies', label: 'Strategies', icon: Target },
                { id: 'config', label: 'Configuration', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading AI data...</p>
              </div>
            ) : activeTab === 'overview' ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">AI System Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Web scraping: Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Analysis: Running</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-gray-700">Outreach: Pending approval</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Learning: Enabled</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Capabilities</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Lead Generation</h4>
                      <p className="text-sm text-gray-600">
                        Continuously scrapes social media, business directories, and event platforms to discover potential venues, musicians, and fans.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Market Intelligence</h4>
                      <p className="text-sm text-gray-600">
                        Monitors music industry news, trends, and competitor activities to identify opportunities and threats.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Strategy Development</h4>
                      <p className="text-sm text-gray-600">
                        Generates marketing strategies with projected ROI based on market intelligence and platform performance data.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Automated Outreach</h4>
                      <p className="text-sm text-gray-600">
                        Creates and manages personalized outreach campaigns with A/B testing and automatic optimization.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'leads' ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Recent Lead Prospects</h3>
                  <span className="text-sm text-gray-500">{stats.totalLeads} total leads</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discovered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentLeads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p>No leads discovered yet. AI scraping will begin shortly.</p>
                          </td>
                        </tr>
                      ) : (
                        recentLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{lead.name}</div>
                              {lead.business_name && (
                                <div className="text-sm text-gray-500">{lead.business_name}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-blue-800">
                                {lead.prospect_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {lead.location_city}, {lead.location_state}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${lead.lead_score}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600">{lead.lead_score}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                lead.contact_status === 'converted' ? 'bg-green-100 text-green-800' :
                                lead.contact_status === 'interested' ? 'bg-rose-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lead.contact_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(lead.discovery_date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'intelligence' ? (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Market Intelligence</h3>
                <div className="space-y-4">
                  {intelligence.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No market intelligence yet. AI analysis will begin shortly.</p>
                    </div>
                  ) : (
                    intelligence.map((intel) => (
                      <div key={intel.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              intel.intelligence_type === 'opportunity' ? 'bg-green-100 text-green-800' :
                              intel.intelligence_type === 'threat' ? 'bg-red-100 text-red-800' :
                              intel.intelligence_type === 'trend' ? 'bg-orange-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {intel.intelligence_type}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              intel.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                              intel.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {intel.sentiment}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Relevance: {intel.relevance_score}/100
                          </div>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{intel.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{intel.summary}</p>
                        <div className="text-xs text-gray-500">
                          Discovered: {new Date(intel.discovered_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeTab === 'strategies' ? (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Generated Marketing Strategies</h3>
                <div className="space-y-4">
                  {strategies.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No strategies yet. AI will propose strategies based on market intelligence.</p>
                    </div>
                  ) : (
                    strategies.map((strategy) => (
                      <div key={strategy.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-purple-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{strategy.strategy_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                {strategy.strategy_type}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                strategy.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                strategy.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                strategy.priority === 'medium' ? 'bg-rose-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {strategy.priority} priority
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                strategy.status === 'approved' ? 'bg-green-100 text-green-800' :
                                strategy.status === 'in_progress' ? 'bg-orange-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {strategy.status}
                              </span>
                            </div>
                          </div>
                          {strategy.projected_roi && (
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Projected ROI</div>
                              <div className="text-2xl font-bold text-green-600">
                                {strategy.projected_roi.toFixed(0)}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeTab === 'config' ? (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">AI Configuration</h3>
                <div className="bg-rose-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">AI Operations Ready</h4>
                      <p className="text-sm text-yellow-800">
                        The AI system is configured and ready to begin operations. You'll need to integrate with external APIs
                        (OpenAI, web scraping services) to enable full autonomous operation.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">System Overview</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>✓ Database schema configured for AI operations</li>
                      <li>✓ Lead tracking and scoring system ready</li>
                      <li>✓ Market intelligence collection ready</li>
                      <li>✓ Strategy generation framework ready</li>
                      <li>✓ Outreach campaign management ready</li>
                      <li>⏳ External API integrations pending</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
