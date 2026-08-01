-- Migration: allow custom subcategory / addon_kind values in partner inventory.
-- The UI now offers a "Custom…" option so partners can enter values not in the
-- predefined list; these CHECK constraints previously rejected such values.
-- Run once in the Supabase SQL editor.

ALTER TABLE partner_equipment_items DROP CONSTRAINT IF EXISTS partner_equipment_items_subcategory_check;
ALTER TABLE partner_service_items   DROP CONSTRAINT IF EXISTS partner_service_items_subcategory_check;
ALTER TABLE partner_addon_items     DROP CONSTRAINT IF EXISTS partner_addon_items_addon_kind_check;

-- Keep NOT NULL where it applied; only the value whitelist is removed.
