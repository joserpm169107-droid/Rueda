# Sobre Ruedas v2.4.0

## Panel administrativo operativo

- Todos los cuadros del Dashboard ahora son interactivos.
- **Conductores activos:** abre la lista de conductores conectados con acciones administrativas.
- **Viajes activos, terminados y cancelados:** abren la sección de viajes con el filtro correcto.
- **Buscando conductor:** abre un radar con conductores activos, ubicación GPS disponible y viajes esperando aceptación.
- **Volumen de hoy:** muestra ingresos totales, promedio y desglose por vehículo.
- **Reportes pendientes:** abre los reportes sin resolver.
- **Reincidentes:** muestra conductores con tres o más calificaciones bajas.

## Control de conductores y pasajeros

- Aprobar conductor.
- Desaprobar y bloquear conductor.
- Eliminar conductor conservando su historial de viajes.
- Ver viajes y reportes por conductor.
- Eliminar pasajeros conservando el historial.
- Los conductores pendientes, bloqueados o eliminados no pueden ponerse en línea ni aceptar viajes.

## Reportes

- Resolver/reabrir reportes.
- Ver viaje asociado.
- Ver historial del conductor.
- Eliminar reportes y retirar la calificación baja asociada para evitar que vuelva a generarse.

## Supabase

- Nuevos campos de aprobación, presencia y ubicación en `profiles`.
- Permisos de eliminación para `profiles`, `driver_reports` y `reports` durante la beta.
- Actualizaciones de `profiles` en tiempo real para el panel.
