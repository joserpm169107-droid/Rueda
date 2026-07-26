
-- Sobre Ruedas v2.3.1
-- Compatibilidad desde v2.2.0
CREATE TABLE IF NOT EXISTS public.admin_users(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text UNIQUE,
 role text DEFAULT 'admin',
 created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.driver_reports(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 driver_id uuid,
 trip_id uuid,
 rating integer,
 passenger_comment text,
 reviewed boolean DEFAULT false,
 created_at timestamptz DEFAULT now()
);

ALTER TABLE public.driver_reports
ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'green';

CREATE INDEX IF NOT EXISTS idx_driver_reports_driver ON public.driver_reports(driver_id);

-- Importar automáticamente calificaciones bajas si existe la tabla trips
DO $$
BEGIN
IF EXISTS (
 SELECT 1 FROM information_schema.tables
 WHERE table_schema='public' AND table_name='trips'
) THEN
 EXECUTE $q$
 INSERT INTO public.driver_reports(driver_id,trip_id,rating,passenger_comment)
 SELECT driver_id,id,rating,comment
 FROM public.trips
 WHERE rating BETWEEN 1 AND 3
 AND NOT EXISTS (
   SELECT 1 FROM public.driver_reports r WHERE r.trip_id=trips.id
 );
$q$;
END IF;
END$$;
