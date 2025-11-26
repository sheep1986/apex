-- =====================================================
-- APEX PLATFORM: Performance Optimization Indexes
-- =====================================================
-- Optimizes database for 50,000 calls/week (~7,142 calls/day)
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/twigokrtbvigiqnaybfy/sql

-- =====================================================
-- CALLS TABLE INDEXES (Most Critical - High Volume)
-- =====================================================

-- Index for fetching calls by organization (most common query)
CREATE INDEX IF NOT EXISTS idx_calls_organization_id
ON public.calls(organization_id);

-- Index for fetching calls by campaign
CREATE INDEX IF NOT EXISTS idx_calls_campaign_id
ON public.calls(campaign_id);

-- Index for fetching recent calls (ordered by created_at)
CREATE INDEX IF NOT EXISTS idx_calls_created_at
ON public.calls(created_at DESC);

-- Composite index for organization + created_at (common filter + sort)
CREATE INDEX IF NOT EXISTS idx_calls_org_created
ON public.calls(organization_id, created_at DESC);

-- Index for call status filtering
CREATE INDEX IF NOT EXISTS idx_calls_status
ON public.calls(status);

-- Index for sentiment analysis queries
CREATE INDEX IF NOT EXISTS idx_calls_sentiment
ON public.calls(sentiment) WHERE sentiment IS NOT NULL;

-- Index for outcome filtering
CREATE INDEX IF NOT EXISTS idx_calls_outcome
ON public.calls(outcome) WHERE outcome IS NOT NULL;

-- Composite index for campaign analytics (campaign + status + created_at)
CREATE INDEX IF NOT EXISTS idx_calls_campaign_analytics
ON public.calls(campaign_id, status, created_at DESC);

-- Index for VAPI call ID lookups (webhook processing)
CREATE INDEX IF NOT EXISTS idx_calls_vapi_id
ON public.calls(vapi_call_id) WHERE vapi_call_id IS NOT NULL;

-- =====================================================
-- LEADS TABLE INDEXES (High Volume)
-- =====================================================

-- Index for organization-scoped queries
CREATE INDEX IF NOT EXISTS idx_leads_organization_id
ON public.leads(organization_id);

-- Index for campaign-specific leads
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id
ON public.leads(campaign_id);

-- Index for lead status filtering
CREATE INDEX IF NOT EXISTS idx_leads_call_status
ON public.leads(call_status);

-- Index for qualification status
CREATE INDEX IF NOT EXISTS idx_leads_qualification
ON public.leads(qualification_status);

-- Composite index for campaign + status
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status
ON public.leads(campaign_id, call_status);

-- Index for phone number lookups (duplicate detection)
CREATE INDEX IF NOT EXISTS idx_leads_phone
ON public.leads(phone);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_leads_email
ON public.leads(email) WHERE email IS NOT NULL;

-- Index for lead scoring queries
CREATE INDEX IF NOT EXISTS idx_leads_score
ON public.leads(score DESC) WHERE score > 0;

-- =====================================================
-- CAMPAIGNS TABLE INDEXES
-- =====================================================

-- Index for organization campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id
ON public.campaigns(organization_id);

-- Index for active campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status
ON public.campaigns(status);

-- Composite index for org + status
CREATE INDEX IF NOT EXISTS idx_campaigns_org_status
ON public.campaigns(organization_id, status);

-- Index for VAPI agent lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_vapi_agent
ON public.campaigns(vapi_agent_id) WHERE vapi_agent_id IS NOT NULL;

-- Index for campaign creation date
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at
ON public.campaigns(created_at DESC);

-- =====================================================
-- USERS TABLE INDEXES
-- =====================================================

-- Index for Clerk ID lookups (authentication)
CREATE INDEX IF NOT EXISTS idx_users_clerk_id
ON public.users(clerk_id) WHERE clerk_id IS NOT NULL;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email
ON public.users(email);

-- Index for organization members
CREATE INDEX IF NOT EXISTS idx_users_organization_id
ON public.users(organization_id);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role
ON public.users(role);

-- =====================================================
-- ORGANIZATIONS TABLE INDEXES
-- =====================================================

-- Index for organization slug (URL-friendly lookup)
CREATE INDEX IF NOT EXISTS idx_organizations_slug
ON public.organizations(slug) WHERE slug IS NOT NULL;

-- Index for organization status
CREATE INDEX IF NOT EXISTS idx_organizations_status
ON public.organizations(status);

-- Index for organization type
CREATE INDEX IF NOT EXISTS idx_organizations_type
ON public.organizations(type);

-- =====================================================
-- CONTACTS TABLE INDEXES (if separate from leads)
-- =====================================================

-- Index for organization contacts
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id
ON public.contacts(organization_id);

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_contacts_phone
ON public.contacts(phone) WHERE phone IS NOT NULL;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email
ON public.contacts(email) WHERE email IS NOT NULL;

-- =====================================================
-- PHONE NUMBERS TABLE INDEXES
-- =====================================================

-- Index for organization phone numbers
CREATE INDEX IF NOT EXISTS idx_phone_numbers_organization_id
ON public.phone_numbers(organization_id);

-- Index for number lookup
CREATE INDEX IF NOT EXISTS idx_phone_numbers_number
ON public.phone_numbers(number);

-- =====================================================
-- FULL-TEXT SEARCH INDEXES (Optional but Recommended)
-- =====================================================

-- Full-text search on call transcripts (if you want to search transcripts)
CREATE INDEX IF NOT EXISTS idx_calls_transcript_search
ON public.calls USING gin(to_tsvector('english', transcript))
WHERE transcript IS NOT NULL;

-- Full-text search on campaign names
CREATE INDEX IF NOT EXISTS idx_campaigns_name_search
ON public.campaigns USING gin(to_tsvector('english', name));

-- Full-text search on lead names/companies
CREATE INDEX IF NOT EXISTS idx_leads_search
ON public.leads USING gin(
  to_tsvector('english',
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(company, '')
  )
);

-- =====================================================
-- PARTIAL INDEXES (For Specific Query Patterns)
-- =====================================================

-- Index only active campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_active
ON public.campaigns(organization_id, created_at DESC)
WHERE status = 'active';

-- Index only completed calls
CREATE INDEX IF NOT EXISTS idx_calls_completed
ON public.calls(campaign_id, created_at DESC)
WHERE status IN ('completed', 'ended');

-- Index only high-score leads
CREATE INDEX IF NOT EXISTS idx_leads_high_score
ON public.leads(campaign_id, score DESC)
WHERE score >= 70;

-- Index only pending calls
CREATE INDEX IF NOT EXISTS idx_leads_pending_calls
ON public.leads(campaign_id, created_at)
WHERE call_status = 'pending';

-- =====================================================
-- JSONB INDEXES (For Custom Fields and Analysis Data)
-- =====================================================

-- Index on custom_fields JSONB column (if heavily queried)
CREATE INDEX IF NOT EXISTS idx_leads_custom_fields
ON public.leads USING gin(custom_fields);

-- Index on call analysis JSONB column
CREATE INDEX IF NOT EXISTS idx_calls_analysis
ON public.calls USING gin(analysis)
WHERE analysis IS NOT NULL;

-- =====================================================
-- VERIFICATION & STATISTICS
-- =====================================================

-- Update table statistics for better query planning
ANALYZE public.calls;
ANALYZE public.leads;
ANALYZE public.campaigns;
ANALYZE public.users;
ANALYZE public.organizations;

-- View all indexes on important tables
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('calls', 'leads', 'campaigns', 'users', 'organizations')
ORDER BY tablename, indexname;

-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Monitor index usage (run after system has been running for a while)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- =====================================================
-- MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- Run VACUUM ANALYZE weekly for tables with high write volume
-- This keeps statistics up to date and reclaims space

-- Example maintenance script (run weekly):
-- VACUUM ANALYZE public.calls;
-- VACUUM ANALYZE public.leads;
-- VACUUM ANALYZE public.campaigns;

-- For very high volume (50K+ calls/week), consider:
-- 1. Partitioning calls table by month/quarter
-- 2. Archiving calls older than 90 days to separate table
-- 3. Upgrading Supabase plan to Pro ($25/month) for better performance
