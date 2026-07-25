-- Migration: Add per-package discount to studio_packages
-- Run this once in the Supabase SQL editor.
--
-- discount_percentage is the percent off this package's price_per_hour.
-- The customer-facing price is derived: discounted = round(price_per_hour * (1 - discount_percentage / 100)).
-- The cheapest package's price is used as a studio's canonical "base package price" everywhere.

ALTER TABLE studio_packages
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0
  CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
