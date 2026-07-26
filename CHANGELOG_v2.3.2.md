# Sobre Ruedas v2.3.2

## Panel administrativo

- Módulo de Reportes completamente funcional.
- Calificaciones de 1, 2 y 3 estrellas con comentario del pasajero.
- Historial por conductor y filtros avanzados.
- Indicadores de riesgo verde, amarillo y rojo.
- Botón para marcar como revisado y opción para reabrir.
- Alertas de conductores reincidentes en el Dashboard.
- Promedio real de calificaciones por conductor.
- Mejor manejo de errores cuando una tabla de Supabase aún no existe.
- Realtime para viajes y reportes.

## Supabase

- Corrige el error `relation public.admin_users does not exist`.
- Corrige el tipo de `driver_reports.driver_id`: ahora es texto, compatible con IDs `device_...`.
- Migra la columna antigua `trip_id` a `ride_id`.
- Importa automáticamente calificaciones bajas existentes.
- Crea un trigger para generar o actualizar reportes al recibir una calificación baja.
- Actualiza el riesgo automáticamente según el historial del conductor.
- SQL idempotente compatible desde v2.2.0 y v2.3.1.

## Aplicación principal

- Evita enviar una calificación dos veces.
- Limpia correctamente el comentario después de calificar.
- Conserva el precio real del viaje en la pantalla final del conductor.
- Actualiza la identificación visual a v2.3.2.
- Actualiza el Service Worker y el manifiesto para eliminar caché antigua.
