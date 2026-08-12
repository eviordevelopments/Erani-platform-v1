-- create_activation_codes.sql
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'claimed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    claimed_at TIMESTAMP WITH TIME ZONE,
    claimed_by_user_id UUID REFERENCES auth.users(id),
    stripe_session_id VARCHAR(255)
);

-- Enable Row Level Security
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone (so users can validate codes)
CREATE POLICY "Allow public read access to activation codes"
ON public.activation_codes
FOR SELECT
TO public
USING (true);

-- Allow backend (service role) to insert/update codes
-- This is handled automatically by the Supabase service_role key
