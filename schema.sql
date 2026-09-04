-- ================================================================
-- Portfolio Database Schema for Supabase (PostgreSQL)
-- ================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates the required tables and security policies for:
-- 1. Live portfolio content (profile, projects, skills, etc.)
-- 2. Visitor contact inquiries / messages
-- ================================================================

-- 1. Portfolio Content Table
CREATE TABLE IF NOT EXISTS public.portfolio (
  id TEXT PRIMARY KEY DEFAULT 'main',
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '{}'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- Row Level Security (RLS) Policies
-- ================================================================

-- Enable RLS on both tables
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Portfolio Policies:
-- Allow anyone (public/anon) to read portfolio data
DROP POLICY IF EXISTS "Public read portfolio" ON public.portfolio;
CREATE POLICY "Public read portfolio"
  ON public.portfolio
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone with anon key to insert initial portfolio data if empty
DROP POLICY IF EXISTS "Public insert portfolio" ON public.portfolio;
CREATE POLICY "Public insert portfolio"
  ON public.portfolio
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow updates to portfolio data
DROP POLICY IF EXISTS "Public update portfolio" ON public.portfolio;
CREATE POLICY "Public update portfolio"
  ON public.portfolio
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Messages Policies:
-- Allow anyone (visitors) to insert messages through the contact form
DROP POLICY IF EXISTS "Public insert messages" ON public.messages;
CREATE POLICY "Public insert messages"
  ON public.messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading messages (for admin dashboard)
DROP POLICY IF EXISTS "Public read messages" ON public.messages;
CREATE POLICY "Public read messages"
  ON public.messages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow deleting messages (for admin dashboard)
DROP POLICY IF EXISTS "Public delete messages" ON public.messages;
CREATE POLICY "Public delete messages"
  ON public.messages
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Allow updating messages (mark as read)
DROP POLICY IF EXISTS "Public update messages" ON public.messages;
CREATE POLICY "Public update messages"
  ON public.messages
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- Enable Realtime (Optional, for instant live reflection)
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
