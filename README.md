# Sobre Ruedas v1.9.0 — prueba con dos teléfonos

Esta versión conecta la página con Supabase.

## Flujo real
- El pasajero crea un viaje en la tabla `rides`.
- Un conductor que esté en **Disponible** lo recibe en tiempo real.
- Aceptar, Llegué, Iniciar viaje y Finalizar viaje se sincronizan entre ambos teléfonos.
- Cancelar el viaje también se guarda en Supabase.

## Paso obligatorio antes de probar
En Supabase → SQL Editor, ejecuta el contenido de:

`CONFIGURAR_PERMISOS_SUPABASE.sql`

Estas políticas son temporales y abiertas únicamente para la prueba de desarrollo. Antes de publicar la aplicación deben reemplazarse por políticas seguras ligadas a usuarios autenticados.

## Abrir después de subir a GitHub
https://joserpm169107-droid.github.io/Rueda/?v=190
