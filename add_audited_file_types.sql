-- SQL para agregar la columna de tipos de archivos a la organización
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS audited_file_types text[] DEFAULT '{}';



