import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Advertisement {
  id: string;
  advertiser_name: string;
  ad_tier: 'premium' | 'standard' | 'basic';
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  impressions: number;
  clicks: number;
}

interface AdBannerProps {
  tier: 'premium' | 'standard' | 'basic';
  placement: string;
  className?: string;
}

export default function AdBanner({ tier, placement, className = '' }: AdBannerProps) {
  const [ad, setAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    loadAd();
  }, [tier, placement]);

  async function loadAd() {
    const { data } = await supabase
      .from('advertisements')
      .select('*')
      .eq('ad_tier', tier)
      .or(`placement.eq.${placement},placement.eq.all`)
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setAd(data);
      trackImpression(data.id);
    }
  }

  async function trackImpression(adId: string) {
    try {
      await supabase.rpc('increment_ad_impressions', { ad_id: adId });
    } catch (err) {
      console.error('Ad tracking error:', err);
    }
  }

  async function handleClick() {
    if (ad) {
      try {
        await supabase.rpc('increment_ad_clicks', { ad_id: ad.id });
      } catch (err) {
        console.error('Ad click tracking error:', err);
      }
      if (ad.link_url) {
        window.open(ad.link_url, '_blank', 'noopener,noreferrer');
      }
    }
  }

  if (!ad) return null;

  const tierStyles = {
    premium: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300',
    standard: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300',
    basic: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300',
  };

  const tierSizes = {
    premium: 'p-6',
    standard: 'p-4',
    basic: 'p-3',
  };

  return (
    <div
      className={`${tierStyles[tier]} ${tierSizes[tier]} border-2 rounded-lg shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Sponsored
            </span>
            {tier === 'premium' && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded">
                FEATURED
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">{ad.title}</h3>
          {ad.description && (
            <p className="text-gray-700 text-sm mb-3">{ad.description}</p>
          )}
        </div>
        {ad.image_url && tier !== 'basic' && (
          <img
            src={ad.image_url}
            alt={ad.title}
            className={`ml-4 rounded object-cover ${
              tier === 'premium' ? 'w-32 h-32' : 'w-20 h-20'
            }`}
          />
        )}
      </div>

      <button
        onClick={handleClick}
        className={`flex items-center space-x-2 ${
          tier === 'premium'
            ? 'bg-gigmate-blue hover:bg-gigmate-blue-dark text-white px-6 py-3 text-base'
            : tier === 'standard'
            ? 'bg-gigmate-blue hover:bg-gigmate-blue-dark text-white px-4 py-2 text-sm'
            : 'text-gigmate-blue hover:text-gigmate-blue-dark text-sm'
        } rounded-md font-semibold transition-colors`}
      >
        <span>Learn More</span>
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}
