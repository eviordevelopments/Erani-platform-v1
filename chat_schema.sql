-- Chat System Schema for Erani Forensic Agent
-- Create this in your Supabase SQL Editor

-- 1. Create chat_threads table
CREATE TABLE public.chat_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.audits(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nueva Conversación',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's threads"
    ON public.chat_threads FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert threads in their organization"
    ON public.chat_threads FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete their threads"
    ON public.chat_threads FOR DELETE
    USING (user_id = auth.uid());


-- 2. Create chat_messages table
CREATE TABLE public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of their organization's threads"
    ON public.chat_messages FOR SELECT
    USING (thread_id IN (
        SELECT id FROM public.chat_threads WHERE organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert messages to their organization's threads"
    ON public.chat_messages FOR INSERT
    WITH CHECK (thread_id IN (
        SELECT id FROM public.chat_threads WHERE organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    ));

-- 3. Create Storage Bucket for Chat Uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_uploads', 'chat_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for chat_uploads
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat_uploads');

CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat_uploads' AND auth.role() = 'authenticated');
