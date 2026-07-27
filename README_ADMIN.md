# Panel administrativo · Sobre Ruedas v2.4.3

Abre `admin.html` desde GitHub Pages.

## Funciones principales

- Dashboard interactivo con detalles al tocar cada indicador.
- Mapa normal de OpenStreetMap con conductores, solicitudes y viajes activos.
- Actualización por Supabase Realtime y respaldo automático cada 10 segundos.
- Páginas de Conductores y Usuarios con búsqueda, filtros, contadores y actualización manual.
- Gestión de viajes activos, buscando conductor, terminados y cancelados.
- Desglose del volumen diario en CUP.
- Gestión de conductores: aprobar, desaprobar, eliminar, restaurar, ver viajes y reportes.
- Eliminación lógica con motivo obligatorio y doble confirmación; conserva el historial.
- Gestión de usuarios: ver viajes, eliminar y restaurar perfil.
- Reportes: resolver, reabrir, eliminar, ver viaje e historial.
- Tarifas exclusivamente por kilómetro.

## Base de datos

Ejecuta `ACTUALIZAR_SUPABASE_v2.4.3.sql` una sola vez después de subir esta versión. La migración es idempotente y conserva viajes e historial existentes.

> El acceso administrativo sigue siendo beta. Antes del lanzamiento público debe reemplazarse el código de desarrollo por Supabase Auth y permisos administrativos reales.
