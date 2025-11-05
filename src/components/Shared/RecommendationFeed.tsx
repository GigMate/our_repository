import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, X, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useBehaviorTracking } from '../../hooks/useBehaviorTracking';

interface Recommendation {
  id: string;
  recommendation_type: string;
  target_id: string;
  target_type: string;
  title: string;
  description: string;
  recommendation_reason: string;
  confidence_score: number;
  expected_revenue: number;
  metadata: any;
  created_at: string;
}

export function RecommendationFeed() {
  const { user } = useAuth();
  const { trackClick, trackEvent } = useBehaviorTracking();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadRecommendations();
  }, [user]);

  async function loadRecommendations() {
    if (!user) return;

    const { data, error } = await supabase
      .from('recommendation_queue')
      .select('*')
      .eq('user_id', user.id)
      .is('dismissed_at', null)
      .is('converted_at', null)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('priority_score', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading recommendations:', error);
      return;
    }

    setRecommendations(data || []);
    setLoading(false);

    if (data && data.length > 0) {
      await supabase
        .from('recommendation_queue')
        .update({ shown_at: new Date().toISOString() })
        .in('id', data.map(r => r.id))
        .is('shown_at', null);
    }
  }

  async function handleRecommendationClick(rec: Recommendation) {
    trackClick(rec.target_type, rec.target_id, 'recommendation_feed');

    await supabase
      .from('recommendation_queue')
      .update({ clicked_at: new Date().toISOString() })
      .eq('id', rec.id);

    await supabase.from('recommendation_clicks').insert({
      recommendation_id: rec.id,
      user_id: user!.id,
    });

    trackEvent({
      eventType: 'click',
      eventCategory: 'engagement',
      targetType: rec.target_type,
      targetId: rec.target_id,
      metadata: { recommendation_id: rec.id, confidence: rec.confidence_score }
    });
  }

  async function dismissRecommendation(recId: string) {
    await supabase
      .from('recommendation_queue')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', recId);

    setRecommendations(prev => prev.filter(r => r.id !== recId));
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-5 h-5" />;
      case 'upgrade':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getRecommendationColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'bg-blue-50 border-blue-200';
    return 'bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-gigmate-blue" />
        <h3 className="text-lg font-bold text-gray-900">Recommended For You</h3>
      </div>

      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className={`p-4 border rounded-lg transition-all hover:shadow-md ${getRecommendationColor(rec.confidence_score)}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-white rounded-lg">
                {getRecommendationIcon(rec.recommendation_type)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {Math.round(rec.confidence_score * 100)}% match
                  </span>
                  {rec.recommendation_reason && (
                    <span className="italic">{rec.recommendation_reason}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <button
                onClick={() => handleRecommendationClick(rec)}
                className="p-2 text-gigmate-blue hover:bg-white rounded-lg transition-colors"
                title="View details"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => dismissRecommendation(rec.id)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
