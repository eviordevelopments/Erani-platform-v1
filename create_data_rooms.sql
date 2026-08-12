-- Create the data_rooms table
CREATE TABLE IF NOT EXISTS public.data_rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color_tag text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for data_rooms
ALTER TABLE public.data_rooms ENABLE ROW LEVEL SECURITY;

-- Allow read access if the user's organization matches
CREATE POLICY "Users can view data_rooms in their org" ON public.data_rooms
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Allow insert/update if the user's organization matches
CREATE POLICY "Users can insert data_rooms in their org" ON public.data_rooms
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update data_rooms in their org" ON public.data_rooms
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete data_rooms in their org" ON public.data_rooms
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Create data_room_collaborators table for fine-grained access
CREATE TABLE IF NOT EXISTS public.data_room_collaborators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data_room_id uuid REFERENCES public.data_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(data_room_id, user_id)
);

-- Enable RLS for data_room_collaborators
ALTER TABLE public.data_room_collaborators ENABLE ROW LEVEL SECURITY;

-- Users can see collaborators of their org's data rooms
CREATE POLICY "Users can view data room collabs in their org" ON public.data_room_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.data_rooms dr
      JOIN public.profiles p ON dr.organization_id = p.organization_id
      WHERE dr.id = public.data_room_collaborators.data_room_id
      AND p.id = auth.uid()
    )
  );

-- Users can insert collabs in their org's data rooms
CREATE POLICY "Users can insert data room collabs in their org" ON public.data_room_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.data_rooms dr
      JOIN public.profiles p ON dr.organization_id = p.organization_id
      WHERE dr.id = data_room_id
      AND p.id = auth.uid()
    )
  );

-- Users can delete collabs in their org's data rooms
CREATE POLICY "Users can delete data room collabs in their org" ON public.data_room_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.data_rooms dr
      JOIN public.profiles p ON dr.organization_id = p.organization_id
      WHERE dr.id = public.data_room_collaborators.data_room_id
      AND p.id = auth.uid()
    )
  );
