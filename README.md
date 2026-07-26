# Sobre Ruedas v2.4.0

Versión para GitHub Pages y Supabase con cobro exclusivamente por kilómetro.

## Actualización desde v2.3.2

1. Conserva una copia de la versión anterior.
2. Sustituye en GitHub los archivos por el contenido de este paquete.
3. En Supabase SQL Editor ejecuta **una sola vez** `ACTUALIZAR_SUPABASE_v2.4.0.sql`.
4. Abre la aplicación con `?v=233` para evitar archivos antiguos en caché.
5. Abre el panel en `admin.html?v=233`.

## Tarifas

- El total se calcula como: **distancia en km × precio por km**.
- No se suma tarifa base.
- No se aplica precio mínimo.
- El panel administrativo solo solicita el precio por km de cada vehículo.
- La aplicación de pasajeros lee esos valores directamente desde `fare_settings` en Supabase.

## Archivos principales

- `index.html`: aplicación para pasajeros y conductores.
- `admin.html`: panel administrativo y configuración por km.
- `ACTUALIZAR_SUPABASE_v2.4.0.sql`: migración completa e idempotente.
- `CONFIGURAR_PANEL_ADMIN.sql`: instalación completa para una base nueva.
- `sw.js` y `manifest.webmanifest`: caché v2.4.0.

## Seguridad de beta

El panel todavía usa el código temporal `RUEDA2026` y políticas abiertas para pruebas. Antes de publicar comercialmente deben activarse Supabase Auth, roles administrativos reales y políticas RLS privadas.
