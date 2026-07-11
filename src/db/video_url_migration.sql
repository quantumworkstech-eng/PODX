-- Migration: Add video_url column to studios table
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

ALTER TABLE studios ADD COLUMN IF NOT EXISTS video_url TEXT;
