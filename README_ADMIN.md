# Sobre Ruedas Admin v2.7.0

El panel administrativo funciona como centro de operaciones de la plataforma.

## Usuarios

Para pasajeros y conductores:

- **Viajes:** historial completo.
- **Suspender:** 7 días, 1 mes, 2 meses o fecha personalizada, siempre con motivo.
- **Levantar suspensión:** reactivación manual antes del vencimiento.
- **Eliminar definitivamente:** borra el perfil, archivos multimedia y registros asociados; requiere escribir `ELIMINAR`.

Los conductores conservan además aprobación, desaprobación, reportes, riesgo y ficha detallada del vehículo.

## Viajes

En la tabla de viajes aparecen acciones para:

- Abrir el detalle.
- Finalizar un viaje aceptado, con conductor llegado o en curso.
- Cancelar una solicitud o viaje activo.

La operación administrativa actualiza el viaje en una sola función de Supabase, limpia la oferta y permite que pasajero y conductor queden libres.

## Soporte e incidencias

- Casos abiertos, en revisión, resueltos y cerrados.
- Prioridad normal, alta o emergencia.
- Conversación con pasajero o conductor.
- Viaje relacionado.
- Finalizar o cancelar el viaje desde el caso.
- Registro del administrador que atendió la incidencia.

## SQL

Ejecuta únicamente `ACTUALIZAR_SUPABASE_v2.7.0.sql` después de publicar los archivos. No vuelvas a ejecutar las migraciones antiguas.
