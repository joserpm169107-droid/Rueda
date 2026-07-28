# Cambios v2.5.0

- Aplicaciones físicamente separadas para pasajero, conductor y administrador.
- Sesiones y dispositivos locales independientes para evitar mezclar perfiles.
- Diseño adaptativo para teléfono, tableta, laptop y escritorio.
- Corrección integral del modo oscuro, áreas seguras de iPhone y navegación inferior.
- Flujo profesional de viaje: búsqueda, aceptación, llegada, recogida, viaje y finalización.
- Despacho por cercanía con ofertas temporales y reasignación tras rechazo o vencimiento.
- Aceptación atómica para impedir que dos conductores tomen el mismo viaje.
- Bloqueo de viajes simultáneos para un mismo conductor y recuperación del viaje activo del pasajero.
- Ruta visual interna por calles, distancia y ETA usando servicios OSM compatibles.
- Navegación externa mediante Google Maps y Waze.
- Seguimiento en tiempo real de la ubicación del conductor para el pasajero.
- Historial y ganancias cargados desde Supabase.
- Auditoría de estados mediante `ride_events`.
- Panel administrativo adaptativo con mapa operativo, incidencias y recuperación de viajes atascados.
- Mejoras de reconexión, caché y recuperación del estado activo con internet inestable.
