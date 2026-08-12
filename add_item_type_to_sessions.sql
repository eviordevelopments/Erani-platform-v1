-- ============================================================
-- ERANI Platform v1 — Add item_type to sessions
-- ============================================================

-- 1. Agregar la columna item_type ('session' o 'task')
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'session';

-- 2. Migrar los datos existentes:
-- Las tareas históricas fueron creadas con status 'todo' o sin scheduled_at (aunque scheduled_at era NOT NULL,
-- usamos el status 'todo' como diferenciador primario).
UPDATE sessions 
SET item_type = 'task' 
WHERE status = 'todo' OR scheduled_at IS NULL;

-- 3. (Opcional) Hacer scheduled_at nullable si no lo es ya, porque las tareas podrían no tener fecha programada estricta
ALTER TABLE sessions ALTER COLUMN scheduled_at DROP NOT NULL;
