-- Create the custom_flows table
DROP TABLE IF EXISTS public.custom_flows CASCADE;

CREATE TABLE IF NOT EXISTS public.custom_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    audit_id UUID REFERENCES public.audits(id) ON DELETE SET NULL,
    automation_id UUID REFERENCES public.automations(id) ON DELETE SET NULL,
    operation_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.custom_flows ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own flows
DROP POLICY IF EXISTS "Users can create their own custom flows" ON public.custom_flows;
CREATE POLICY "Users can create their own custom flows" ON public.custom_flows FOR INSERT TO authenticated WITH CHECK (true);

-- Allow users to view their own flows
DROP POLICY IF EXISTS "Users can view their own custom flows" ON public.custom_flows;
CREATE POLICY "Users can view their own custom flows" ON public.custom_flows FOR SELECT TO authenticated USING (user_email = (auth.jwt() ->> 'email'));

-- Allow service role to view and update all flows
DROP POLICY IF EXISTS "Service role can view and update all custom flows" ON public.custom_flows;
CREATE POLICY "Service role can view and update all custom flows" ON public.custom_flows FOR ALL USING (true);
