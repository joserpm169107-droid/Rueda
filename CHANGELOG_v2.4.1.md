# Sobre Ruedas v2.4.1

## Panel administrativo

- Reemplaza el radar oscuro por un mapa normal de OpenStreetMap.
- Muestra conductores activos, solicitudes buscando conductor y viajes activos.
- Actualiza marcadores por Realtime y con respaldo automático cada 10 segundos.
- Añade filtros del mapa, centrado y actualización manual.
- Corrige la actualización de las páginas Conductores y Usuarios.
- Añade contadores, hora de última actualización y filtros por estado.
- Permite ver también perfiles eliminados y restaurarlos.

## Control de conductores

- Aprobar y desaprobar con registro administrativo.
- Eliminación con motivo obligatorio y doble confirmación.
- Cancela viajes activos solo después de confirmación expresa.
- Conserva el historial de viajes, reportes y calificaciones.
- Bloquea inmediatamente el acceso del conductor eliminado.
- Guarda auditoría en `admin_action_log`.

## Aplicación de usuarios y conductores

- Todos los métodos de inicio crean o recuperan el perfil en Supabase.
- La aprobación, bloqueo o eliminación se refleja en tiempo real en el teléfono.
- Al ponerse disponible, el conductor activa el GPS y actualiza su ubicación.
- La presencia se renueva cada 15 segundos.
- Las solicitudes guardan coordenadas de recogida, destino y distancia.
