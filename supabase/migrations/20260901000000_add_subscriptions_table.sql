-- ============================================================
-- Migration: Add subscriptions table for provider subscription model
-- Free / Pro / Pro+ plans with manual payment verification
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id             uuid REFERENCES service_providers(id) ON DELETE CASCADE,
  plan                    text NOT NULL CHECK (plan IN ('free', 'pro', 'pro_plus')),
  status                  text NOT NULL DEFAULT 'pending_payment'
                            CHECK (status IN ('active', 'pending_payment', 'expired', 'rejected')),
  amount                  numeric NOT NULL DEFAULT 0,
  payment_screenshot_url  text,
  payment_screenshot_name text,
  start_date              timestamptz,
  end_date                timestamptz,
  requested_at            timestamptz DEFAULT now(),
  verified_at             timestamptz,
  verified_by             uuid REFERENCES users(id),
  rejection_reason        text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_id ON subscriptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_requested_at ON subscriptions(requested_at DESC);

-- Enable real-time for live admin updates
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
