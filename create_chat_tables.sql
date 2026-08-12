-- Creación de tabla de Hilos (Chat Threads)
CREATE TABLE IF NOT EXISTS public.chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    project_id UUID,
    title TEXT NOT NULL DEFAULT 'Nueva Conversación',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creación de tabla de Mensajes (Chat Messages)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activar Row Level Security (RLS)
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para Hilos
CREATE POLICY "Users can read their org threads" ON public.chat_threads
    FOR SELECT USING (auth.uid() = user_id OR organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert own threads" ON public.chat_threads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own threads" ON public.chat_threads
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Mensajes
CREATE POLICY "Users can read messages in their threads" ON public.chat_messages
    FOR SELECT USING (thread_id IN (
        SELECT id FROM public.chat_threads WHERE user_id = auth.uid() OR organization_id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Refrescar el caché interno de Supabase
NOTIFY pgrst, 'reload schema';
