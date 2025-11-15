/*
  # Create Performance Monitoring System

  ## Summary
  This migration creates a comprehensive performance monitoring system to track
  database performance, slow queries, and system health before and during beta launch.

  ## Features
  
  1. **Query Performance Tracking**
     - Tracks query execution patterns
     - Enables optimization opportunities
  
  2. **System Health Monitoring**
     - Database size tracking
     - Connection pool monitoring
     - Table statistics
  
  3. **Performance Views**
     - Index usage statistics
     - Table size analysis
     - Connection statistics

  ## Views Created
  
  - table_size_report - Tracks database growth
  - index_usage_stats - Monitors index effectiveness
  - database_health_check - Overall system health

  ## Usage
  
  Admins can query these views to monitor performance:
  ```sql
  SELECT * FROM table_size_report ORDER BY total_bytes DESC LIMIT 20;
  SELECT * FROM index_usage_stats WHERE usage_category = 'UNUSED';
  SELECT * FROM database_health_check;
  ```
*/

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text,
  tags jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Admins can view metrics
CREATE POLICY "Admins can view performance metrics"
  ON performance_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- System can insert metrics
CREATE POLICY "System can insert metrics"
  ON performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_perf_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_recorded_at ON performance_metrics(recorded_at DESC);

-- Create view for table size monitoring
CREATE OR REPLACE VIEW table_size_report AS
SELECT 
  t.schemaname,
  t.tablename,
  pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(t.schemaname||'.'||t.tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename) - pg_relation_size(t.schemaname||'.'||t.tablename)) AS index_size,
  pg_total_relation_size(t.schemaname||'.'||t.tablename) AS total_bytes
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY pg_total_relation_size(t.schemaname||'.'||t.tablename) DESC;

-- Create view for index usage statistics (using correct column names)
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
  i.schemaname,
  i.relname as tablename,
  i.indexrelname as indexname,
  i.idx_scan as index_scans,
  i.idx_tup_read as tuples_read,
  i.idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
  CASE 
    WHEN i.idx_scan = 0 THEN 0
    ELSE ROUND((i.idx_tup_fetch::numeric / NULLIF(i.idx_scan, 0))::numeric, 2)
  END as avg_tuples_per_scan,
  CASE
    WHEN i.idx_scan = 0 THEN 'UNUSED'
    WHEN i.idx_scan < 100 THEN 'LOW USAGE'
    ELSE 'ACTIVE'
  END as usage_category
FROM pg_stat_user_indexes i
WHERE i.schemaname = 'public'
ORDER BY i.idx_scan ASC, pg_relation_size(i.indexrelid) DESC;

-- Create view for table statistics
CREATE OR REPLACE VIEW table_stats_report AS
SELECT
  s.schemaname,
  s.relname as tablename,
  s.n_live_tup as live_rows,
  s.n_dead_tup as dead_rows,
  CASE 
    WHEN s.n_live_tup > 0 
    THEN ROUND((s.n_dead_tup::numeric / s.n_live_tup::numeric * 100)::numeric, 2)
    ELSE 0
  END as dead_row_percent,
  s.last_vacuum,
  s.last_autovacuum,
  s.last_analyze,
  s.last_autoanalyze,
  s.vacuum_count,
  s.autovacuum_count,
  s.analyze_count,
  s.autoanalyze_count
FROM pg_stat_user_tables s
WHERE s.schemaname = 'public'
ORDER BY s.n_live_tup DESC;

-- Create view for database health check
CREATE OR REPLACE VIEW database_health_check AS
SELECT
  'Total Tables' as metric,
  COUNT(*)::text as value,
  'tables' as unit
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Total Indexes' as metric,
  COUNT(*)::text as value,
  'indexes' as unit
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT
  'RLS Enabled Tables' as metric,
  COUNT(*)::text as value,
  'tables' as unit
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT
  'Database Size' as metric,
  pg_size_pretty(pg_database_size(current_database()))::text as value,
  'bytes' as unit
UNION ALL
SELECT
  'Active Connections' as metric,
  COUNT(*)::text as value,
  'connections' as unit
FROM pg_stat_activity
WHERE state = 'active'
UNION ALL
SELECT
  'Idle Connections' as metric,
  COUNT(*)::text as value,
  'connections' as unit
FROM pg_stat_activity
WHERE state = 'idle';

-- Create view for connection statistics
CREATE OR REPLACE VIEW connection_stats AS
SELECT
  datname as database,
  usename as username,
  application_name,
  client_addr,
  state,
  COUNT(*) as connection_count,
  MAX(backend_start) as latest_connection
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY datname, usename, application_name, client_addr, state
ORDER BY connection_count DESC;

-- Create function to record performance metric
CREATE OR REPLACE FUNCTION record_performance_metric(
  p_metric_name text,
  p_metric_value numeric,
  p_metric_unit text DEFAULT NULL,
  p_tags jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metric_id uuid;
BEGIN
  INSERT INTO performance_metrics (
    metric_name,
    metric_value,
    metric_unit,
    tags
  ) VALUES (
    p_metric_name,
    p_metric_value,
    p_metric_unit,
    p_tags
  )
  RETURNING id INTO v_metric_id;
  
  RETURN v_metric_id;
END;
$$;

-- Create function to get recent metrics
CREATE OR REPLACE FUNCTION get_recent_metrics(
  p_metric_name text,
  p_hours int DEFAULT 24
)
RETURNS TABLE (
  recorded_at timestamptz,
  metric_value numeric,
  metric_unit text,
  tags jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.recorded_at,
    pm.metric_value,
    pm.metric_unit,
    pm.tags
  FROM performance_metrics pm
  WHERE pm.metric_name = p_metric_name
    AND pm.recorded_at > now() - (p_hours || ' hours')::interval
  ORDER BY pm.recorded_at DESC;
END;
$$;

-- Create table for backup verification logs
CREATE TABLE IF NOT EXISTS backup_verification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL CHECK (backup_type IN ('daily', 'weekly', 'manual', 'pre_deployment')),
  backup_timestamp timestamptz NOT NULL,
  verification_status text CHECK (verification_status IN ('success', 'failed', 'pending')),
  backup_size_bytes bigint,
  verification_notes text,
  verified_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE backup_verification_log ENABLE ROW LEVEL SECURITY;

-- Admins can manage backup logs
CREATE POLICY "Admins can manage backup logs"
  ON backup_verification_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_backup_log_timestamp ON backup_verification_log(backup_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_backup_log_status ON backup_verification_log(verification_status);

-- Add comments for documentation
COMMENT ON VIEW table_size_report IS 'Reports size of all tables and their indexes for capacity planning';
COMMENT ON VIEW index_usage_stats IS 'Shows index usage statistics to identify unused or underutilized indexes';
COMMENT ON VIEW table_stats_report IS 'Provides table statistics including row counts and vacuum status';
COMMENT ON VIEW database_health_check IS 'Quick health check of database status and metrics';
COMMENT ON VIEW connection_stats IS 'Monitors database connections by user and application';
COMMENT ON TABLE performance_metrics IS 'Stores historical performance metrics for trending and analysis';
COMMENT ON TABLE backup_verification_log IS 'Tracks backup verification activities and status';
