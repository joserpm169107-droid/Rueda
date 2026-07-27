# Sobre Ruedas v2.4.2

## Correcciones

- Corrige el error **“No se pudo crear el perfil administrativo”** al aprobar conductores.
- El panel consulta o crea el perfil real del conductor sin depender de un `upsert` incompatible.
- Corrige **“No se pudo guardar el perfil”** en la aplicación del conductor.
- Conserva el estado aprobado, rechazado o eliminado cuando el usuario vuelve a iniciar sesión.
- Restaura los permisos RLS compatibles con la arquitectura beta basada en `device_id`.
- Cambia el índice de `device_id` a una restricción única compatible con PostgREST.
- Actualiza la caché PWA para publicar los archivos corregidos.

## Instalación

Sube todos los archivos a GitHub y ejecuta una sola vez `ACTUALIZAR_SUPABASE_v2.4.2.sql`.
