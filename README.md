# Sobre Ruedas v2.8.0

Versión de estabilización operativa para pasajero, conductor y administración.

## Aplicaciones

- `index.html` — Sobre Ruedas, pasajero.
- `conductor.html` — Sobre Ruedas Conductor.
- `admin.html` — Sobre Ruedas Admin.

## Cambios principales

- La pantalla del pasajero cambia automáticamente al seguimiento cuando un conductor acepta.
- Recuperación del viaje activo al recargar, regresar a la app o recuperar internet.
- Actualización automática al finalizar o cancelar el viaje.
- Calificación pendiente recuperable y reportes automáticos para evaluaciones bajas.
- Chat interno y llamada privada por internet vinculados al viaje.
- Reportes de Ayuda visibles en Soporte e incidencias del administrador.
- Finalización o cancelación administrativa de viajes con liberación de ambas cuentas.
- Suspender, levantar suspensión, desactivar, reactivar y eliminar definitivamente pasajeros y conductores.
- El conductor suspendido o desactivado queda fuera de línea y no puede aceptar servicios.
- Ganancias del conductor comienzan en 0 CUP y suman únicamente viajes finalizados.
- Buscador escrito de direcciones reconstruido, con selección manual en el mapa como alternativa.
- Compresión automática de fotografías antes de subirlas.
- Caché renovada para impedir que el teléfono conserve la versión anterior.

## Instalación

1. Haz una copia de seguridad del proyecto y de Supabase.
2. Sube todos los archivos de esta carpeta a GitHub y reemplaza los existentes.
3. En Supabase abre **SQL Editor → New query**.
4. Copia y ejecuta únicamente `ACTUALIZAR_SUPABASE_v2.8.0.sql`.
5. No ejecutes nuevamente los archivos de `SQL_ANTERIORES`.
6. Espera la publicación de GitHub Pages.
7. Cierra por completo las aplicaciones instaladas o el navegador y vuelve a abrirlas.

Si Supabase muestra la advertencia de RLS, usa **Run without RLS**. La migración configura sus propias políticas.

## Validación

Se comprobaron localmente la sintaxis de todos los archivos JavaScript, los scripts incluidos en los tres HTML, las referencias internas y la integridad del ZIP. La prueba definitiva debe realizarse contra tu proyecto real de Supabase usando dos teléfonos y el panel administrativo.
