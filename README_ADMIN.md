# Panel administrativo · Sobre Ruedas v2.4.0

1. Ejecuta `ACTUALIZAR_SUPABASE_v2.4.0.sql` en Supabase SQL Editor.
2. Sube todos los archivos del paquete a GitHub.
3. Abre `admin.html?v=233` desde GitHub Pages.
4. Durante la beta, el código temporal es `RUEDA2026`.

## Módulo de Reportes

- Importa automáticamente calificaciones de 1, 2 y 3 estrellas.
- Muestra el comentario del pasajero y los datos del viaje.
- Mantiene historial por conductor.
- Calcula riesgo verde, amarillo y rojo.
- Permite marcar un reporte como revisado o reabrirlo.
- Incluye filtros por conductor, calificación, estado, fecha y texto.
- Muestra alertas de reincidencia en el Dashboard.

## Niveles de riesgo

- Verde: 1 o 2 reportes.
- Amarillo: 3 o 4 reportes.
- Rojo: 5 o más reportes.

**Importante:** el acceso por código y las políticas abiertas son solo para pruebas. Antes del lanzamiento público hay que activar Supabase Auth, roles reales y políticas RLS privadas.

## Actualización v2.4.0
Ejecuta `ACTUALIZAR_SUPABASE_v2.4.0.sql` una sola vez. Después recarga `admin.html` con Ctrl+F5.
Los cuadros del resumen son botones y abren vistas filtradas. Las decisiones sobre conductores y reportes se guardan en Supabase.
