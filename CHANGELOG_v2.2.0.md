# Sobre Ruedas v2.2.0 — Estabilidad y control

## Aplicación de pasajeros y conductores
- Evita que dos búsquedas de dirección se mezclen entre sí.
- Bloquea temporalmente el botón de búsqueda mientras se calcula la ruta.
- Limpia el mapa, la ruta y el viaje activo al cancelar o terminar.
- Guarda una copia más completa del viaje activo para recuperación en conexión lenta.
- Actualiza las ganancias del conductor al finalizar.
- Identificación visual de versión v2.2.0.

## Panel administrativo
- Búsqueda de viajes por pasajero, conductor, recogida, destino o vehículo.
- Filtro de viajes por fecha.
- Identificación visual Admin v2.2.0.

## Instalación
1. Sustituir los archivos del repositorio por los de este ZIP.
2. No borrar tablas ni datos de Supabase.
3. Ejecutar `ACTUALIZAR_SUPABASE_v2.2.0.sql` una sola vez.
4. Publicar el commit y abrir la app con `?v=220`.
