# Sobre Ruedas v2.4.3

- Corrige el error **No se pudo eliminar el conductor**.
- La eliminación ahora es lógica y conserva viajes, reportes y calificaciones.
- Evita incompatibilidades con bases antiguas que restringen los valores de `profiles.status`.
- Bloquea inmediatamente el acceso usando `approval_status = 'deleted'`.
- Corrige la detección de cuentas eliminadas en la aplicación del conductor y pasajero.
- Mejora el mensaje del panel mostrando el error real de Supabase si algo vuelve a fallar.
