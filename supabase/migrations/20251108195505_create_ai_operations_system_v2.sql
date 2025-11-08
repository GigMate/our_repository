/*
  # AI Operations System for GigMate

  This migration creates the infrastructure for AI-driven autonomous operations.

  ## New Tables Created

  ### ai_lead_prospects
  - Stores potential clients discovered by AI scraping
  - Includes contact information, source, and scoring
  - Tracks conversion status and engagement history

  ### ai_market_intelligence
  - Stores music industry news and trends discovered by AI
  - Includes sentiment analysis and relevance scoring
  - Links to actionable strategies

  ### ai_marketing_strategies
  - AI-generated marketing strategies based on market intelligence
  - Includes campaign ideas, target audiences, and projected ROI
  - Tracks implementation status and actual results

  ### ai_outreach_campaigns
  - Automated outreach campaigns managed by AI
  - Tracks messages sent, responses, and conversion rates
  - A/B testing and optimization built-in

  ### ai_operations_log
  - Comprehensive log of all AI operations
  - Tracks decisions made, actions taken, and outcomes
  - Enables AI learning and performance monitoring

  ### ai_configuration
  - Settings and parameters for AI operations
  - Defines automation rules and guardrails
  - Allows human oversight and intervention

  ## Security
  - RLS enabled on all tables
  - Investor-only access for configuration (investors act as admins)
  - Audit trail for all AI actions
  - Human approval gates for critical decisions
*/

-- Lead prospects discovered by AI
CREATE TABLE IF NOT EXISTS ai_lead_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_type text NOT NULL CHECK (prospect_type IN ('venue', 'musician', 'fan', 'sponsor', 'media')),
  name text NOT NULL,
  business_name text,
  email text,
  phone text,
  website text,
  social_media_links jsonb DEFAULT '{}',
  location_city text,
  location_state text,
  discovery_source text NOT NULL,
  discovery_url text,
  discovery_date timestamptz DEFAULT now(),
  lead_score integer CHECK (lead_score >= 0 AND lead_score <= 100),
  qualification_notes text,
  contact_status text DEFAULT 'new' CHECK (contact_status IN ('new', 'contacted', 'responded', 'interested', 'converted', 'not_interested', 'invalid')),
  assigned_to text,
  last_contact_date timestamptz,
  conversion_date timestamptz,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Market intelligence gathered by AI
CREATE TABLE IF NOT EXISTS ai_market_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_type text NOT NULL CHECK (intelligence_type IN ('news', 'trend', 'competitor', 'opportunity', 'threat', 'regulation')),
  title text NOT NULL,
  summary text NOT NULL,
  full_content text,
  source_url text,
  source_name text,
  published_date timestamptz,
  discovered_date timestamptz DEFAULT now(),
  relevance_score integer CHECK (relevance_score >= 0 AND relevance_score <= 100),
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  geographic_focus text[],
  key_topics text[],
  actionable_insights text,
  recommended_actions text[],
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'actioned', 'archived')),
  reviewed_by text,
  reviewed_date timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- AI-generated marketing strategies
CREATE TABLE IF NOT EXISTS ai_marketing_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_name text NOT NULL,
  strategy_type text NOT NULL CHECK (strategy_type IN ('acquisition', 'retention', 'engagement', 'monetization', 'brand_awareness', 'partnership')),
  target_audience text NOT NULL,
  objective text NOT NULL,
  description text NOT NULL,
  tactics text[],
  channels text[],
  projected_roi numeric(10,2),
  estimated_cost numeric(10,2),
  estimated_timeframe text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'in_progress', 'completed', 'paused', 'cancelled')),
  actual_roi numeric(10,2),
  actual_cost numeric(10,2),
  performance_metrics jsonb DEFAULT '{}',
  based_on_intelligence uuid REFERENCES ai_market_intelligence(id),
  created_by_ai boolean DEFAULT true,
  approved_by text,
  approved_date timestamptz,
  implementation_start_date timestamptz,
  completion_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI-managed outreach campaigns
CREATE TABLE IF NOT EXISTS ai_outreach_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('email', 'social_media', 'sms', 'direct_mail', 'phone')),
  target_segment text NOT NULL,
  message_template text NOT NULL,
  personalization_variables jsonb DEFAULT '{}',
  target_count integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  messages_delivered integer DEFAULT 0,
  messages_opened integer DEFAULT 0,
  responses_received integer DEFAULT 0,
  conversions integer DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  start_date timestamptz,
  end_date timestamptz,
  ab_testing_enabled boolean DEFAULT false,
  ab_test_variants jsonb DEFAULT '[]',
  optimization_notes text,
  roi numeric(10,2),
  created_by_ai boolean DEFAULT true,
  requires_approval boolean DEFAULT true,
  approved_by text,
  approved_date timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comprehensive AI operations log
CREATE TABLE IF NOT EXISTS ai_operations_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL CHECK (operation_type IN ('scraping', 'analysis', 'strategy_generation', 'outreach', 'optimization', 'decision', 'learning')),
  operation_name text NOT NULL,
  description text,
  input_data jsonb,
  output_data jsonb,
  decision_rationale text,
  confidence_score numeric(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status text DEFAULT 'success' CHECK (status IN ('success', 'partial_success', 'failed', 'pending_approval')),
  error_message text,
  execution_time_ms integer,
  resources_used jsonb DEFAULT '{}',
  human_intervention_required boolean DEFAULT false,
  human_approved boolean,
  approved_by text,
  approval_notes text,
  related_records jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- AI configuration and settings
CREATE TABLE IF NOT EXISTS ai_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  category text CHECK (category IN ('scraping', 'analysis', 'marketing', 'outreach', 'learning', 'safety', 'performance')),
  requires_approval_for_change boolean DEFAULT true,
  last_modified_by text,
  last_modified_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_lead_prospects_type ON ai_lead_prospects(prospect_type);
CREATE INDEX IF NOT EXISTS idx_ai_lead_prospects_status ON ai_lead_prospects(contact_status);
CREATE INDEX IF NOT EXISTS idx_ai_lead_prospects_score ON ai_lead_prospects(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_lead_prospects_discovery_date ON ai_lead_prospects(discovery_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_market_intelligence_type ON ai_market_intelligence(intelligence_type);
CREATE INDEX IF NOT EXISTS idx_ai_market_intelligence_relevance ON ai_market_intelligence(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_market_intelligence_date ON ai_market_intelligence(discovered_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_market_intelligence_status ON ai_market_intelligence(status);

CREATE INDEX IF NOT EXISTS idx_ai_marketing_strategies_status ON ai_marketing_strategies(status);
CREATE INDEX IF NOT EXISTS idx_ai_marketing_strategies_priority ON ai_marketing_strategies(priority);
CREATE INDEX IF NOT EXISTS idx_ai_marketing_strategies_type ON ai_marketing_strategies(strategy_type);

CREATE INDEX IF NOT EXISTS idx_ai_outreach_campaigns_status ON ai_outreach_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ai_outreach_campaigns_type ON ai_outreach_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_ai_outreach_campaigns_dates ON ai_outreach_campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_ai_operations_log_type ON ai_operations_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_operations_log_date ON ai_operations_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_operations_log_status ON ai_operations_log(status);

-- Enable Row Level Security
ALTER TABLE ai_lead_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_operations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configuration ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Investor access - they act as platform administrators)
CREATE POLICY "Investor full access to lead prospects"
  ON ai_lead_prospects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'investor'
    )
  );

CREATE POLICY "Investor full access to market intelligence"
  ON ai_market_intelligence
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'investor'
    )
  );

CREATE POLICY "Investor full access to marketing strategies"
  ON ai_marketing_strategies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'investor'
    )
  );

CREATE POLICY "Investor full access to outreach campaigns"
  ON ai_outreach_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'investor'
    )
  );

CREATE POLICY "Investor full access to operations log"
  ON ai_operations_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'investor'
    )
  );

CREATE POLICY "Investor full access to AI configuration"
  ON ai_configuration
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'investor'
    )
  );

-- Insert default AI configuration
INSERT INTO ai_configuration (config_key, config_value, description, category) VALUES
  ('scraping_enabled', 'true', 'Master switch for AI web scraping operations', 'scraping'),
  ('scraping_frequency_hours', '24', 'How often to run scraping operations (in hours)', 'scraping'),
  ('scraping_sources', '["linkedin", "facebook", "instagram", "google_business", "yelp", "bandsintown", "songkick", "reverbnation", "sonicbids"]', 'Data sources for lead discovery', 'scraping'),
  ('lead_score_threshold', '60', 'Minimum score required to consider a lead viable', 'analysis'),
  ('auto_outreach_enabled', 'false', 'Allow AI to automatically send outreach messages', 'outreach'),
  ('outreach_requires_approval', 'true', 'Require human approval before sending outreach', 'outreach'),
  ('max_daily_outreach', '100', 'Maximum number of outreach messages per day', 'safety'),
  ('strategy_confidence_threshold', '75', 'Minimum confidence score for AI to propose strategies', 'marketing'),
  ('auto_optimization_enabled', 'true', 'Allow AI to automatically optimize campaigns', 'performance'),
  ('learning_mode_enabled', 'true', 'Enable AI learning from outcomes', 'learning'),
  ('geographic_focus', '["Texas", "Hill Country", "Austin", "San Antonio"]', 'Primary geographic markets to target', 'marketing'),
  ('target_venue_capacity_min', '50', 'Minimum venue capacity to target', 'scraping'),
  ('target_musician_genres', '["Country", "Rock", "Blues", "Folk", "Americana", "Jazz"]', 'Music genres to focus on', 'scraping')
ON CONFLICT (config_key) DO NOTHING;
