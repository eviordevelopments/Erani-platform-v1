-- Create the erani_services table
CREATE TABLE IF NOT EXISTS public.erani_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    service_type TEXT NOT NULL CHECK (service_type IN ('strategy', 'maximization', 'additional')),
    provider_name TEXT NOT NULL,
    logo_url TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'coming_soon')),
    cta_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.erani_services ENABLE ROW LEVEL SECURITY;

-- Allow public read access to services
DROP POLICY IF EXISTS "Enable read access for all users" ON public.erani_services;
CREATE POLICY "Enable read access for all users" ON public.erani_services FOR SELECT USING (true);

-- Create Storage Bucket for Service Logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service_logos', 'service_logos', true) 
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'service_logos');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'service_logos');
