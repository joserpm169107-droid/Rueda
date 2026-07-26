# Sobre Ruedas v2.3.2

Versión estable para GitHub Pages y Supabase.

## Actualización desde v2.2.0 o v2.3.1

1. Conserva una copia de la versión anterior.
2. Sustituye en GitHub los archivos por el contenido de este paquete.
3. En Supabase SQL Editor ejecuta **una sola vez** `ACTUALIZAR_SUPABASE_v2.3.2.sql`.
4. Abre la aplicación con `?v=232` para evitar que el navegador use archivos antiguos.
5. Abre el panel en `admin.html?v=232`.

El SQL es idempotente: puede volver a ejecutarse si una ejecución se interrumpe. No elimina viajes ni usuarios existentes.

## Archivos principales

- `index.html`: aplicación para pasajeros y conductores.
- `admin.html`: panel administrativo con reportes.
- `ACTUALIZAR_SUPABASE_v2.3.2.sql`: migración completa y recomendada.
- `CONFIGURAR_PANEL_ADMIN.sql`: instalación completa del panel; contiene la misma protección de compatibilidad.
- `sw.js` y `manifest.webmanifest`: aplicación web instalable y caché v2.3.2.

## Seguridad de beta

El panel todavía usa el código temporal `RUEDA2026` y políticas abiertas para pruebas. Antes de publicar comercialmente deben activarse Supabase Auth, roles administrativos reales y políticas RLS privadas.
