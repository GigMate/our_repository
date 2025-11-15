import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface TrackEventParams {
  eventType: string;
  eventCategory: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

export function useBehaviorTracking() {
  const { user } = useAuth();

  const generateSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('gigmate_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('gigmate_session_id', sessionId);
    }
    return sessionId;
  }, []);

  const trackEvent = useCallback(async ({
    eventType,
    eventCategory,
    targetType,
    targetId,
    metadata = {}
  }: TrackEventParams) => {
    if (!user?.id) return;

    try {
      await supabase.from('user_behavior_events').insert({
        user_id: user.id,
        event_type: eventType,
        event_category: eventCategory,
        target_type: targetType,
        target_id: targetId,
        metadata,
        session_id: generateSessionId(),
        device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        referrer_url: document.referrer,
        page_url: window.location.href,
      });
    } catch (error) {
      console.error('Behavior tracking error:', error);
    }
  }, [user, generateSessionId]);

  const trackPageView = useCallback((pageName: string) => {
    trackEvent({
      eventType: 'page_view',
      eventCategory: 'discovery',
      metadata: { page_name: pageName }
    });
  }, [trackEvent]);

  const trackProfileView = useCallback((profileId: string, profileType: string) => {
    trackEvent({
      eventType: 'profile_view',
      eventCategory: 'discovery',
      targetType: profileType,
      targetId: profileId,
    });
  }, [trackEvent]);

  const trackEventView = useCallback((eventId: string) => {
    trackEvent({
      eventType: 'event_view',
      eventCategory: 'discovery',
      targetType: 'event',
      targetId: eventId,
    });
  }, [trackEvent]);

  const trackSearch = useCallback(async (query: string, searchType: string, filters?: any) => {
    if (!user?.id) return;

    trackEvent({
      eventType: 'search',
      eventCategory: 'discovery',
      metadata: { query, search_type: searchType, filters }
    });

    try {
      await supabase.from('search_history').insert({
        user_id: user.id,
        search_query: query,
        search_type: searchType,
        filters_applied: filters || {},
        session_id: generateSessionId(),
      });
    } catch (error) {
      console.error('Search tracking error:', error);
    }
  }, [user, trackEvent, generateSessionId]);

  const trackPurchase = useCallback(async (
    purchaseType: string,
    amount: number,
    targetId?: string,
    targetType?: string
  ) => {
    if (!user?.id) return;

    trackEvent({
      eventType: 'payment_complete',
      eventCategory: 'transaction',
      targetType,
      targetId,
      metadata: { amount, purchase_type: purchaseType }
    });

    try {
      await supabase.from('purchase_patterns').insert({
        user_id: user.id,
        purchase_type: purchaseType,
        amount,
        target_id: targetId,
        target_type: targetType,
        last_purchase_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Purchase tracking error:', error);
    }
  }, [user, trackEvent]);

  const trackClick = useCallback((targetType: string, targetId: string, context?: string) => {
    trackEvent({
      eventType: 'click',
      eventCategory: 'engagement',
      targetType,
      targetId,
      metadata: { context }
    });
  }, [trackEvent]);

  const trackMediaPlay = useCallback((mediaType: 'video' | 'audio', mediaId: string) => {
    trackEvent({
      eventType: mediaType === 'video' ? 'video_play' : 'audio_play',
      eventCategory: 'content',
      targetId: mediaId,
      metadata: { media_type: mediaType }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackProfileView,
    trackEventView,
    trackSearch,
    trackPurchase,
    trackClick,
    trackMediaPlay,
  };
}
