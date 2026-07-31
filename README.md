# Sobre Ruedas v2.7.0

Actualización enfocada en estabilidad operativa, comunicación y control administrativo.

## Pasajero

- Aplicación separada de la aplicación del conductor.
- Búsqueda escrita de destinos con sugerencias de Photon/OpenStreetMap, búsqueda explícita con Nominatim y puntos locales de Ciego de Ávila.
- Alternativa para marcar el destino directamente en el mapa cuando una dirección no aparece.
- Chat interno con el conductor durante el viaje.
- Mensajes rápidos y estados de lectura.
- Llamada de audio por internet sin mostrar los números telefónicos reales.
- Centro de ayuda para crear casos y conversar con administración.
- Foto de perfil optimizada antes de subirla.

## Conductor

- Bloqueo operativo cuando el perfil está suspendido, eliminado, desaprobado o no aprobado.
- Un conductor suspendido se desconecta, no aparece disponible y no puede recibir ni aceptar viajes.
- Chat y llamada privada por internet con el pasajero.
- Ayuda contextual para problemas de recogida, navegación, precio, seguridad, averías y finalización.
- Foto personal, foto del vehículo, identificación y ficha completa del vehículo.
- Compresión automática de imágenes para reducir consumo de datos.

## Administración

- Finalización o cancelación atómica de viajes activos, liberando pasajero y conductor.
- Suspensión temporal de pasajeros y conductores con fecha, motivo y reactivación manual o automática.
- Eliminación definitiva tolerante a diferencias de esquema de versiones anteriores.
- Historial de viajes y acciones administrativas.
- Módulo de Soporte e incidencias con prioridades, conversación, estado y acciones sobre el viaje relacionado.
- Actualización en tiempo real de casos, mensajes, viajes y perfiles.

## Fotografías

- Perfil: recorte cuadrado, máximo aproximado de 512 × 512 px y objetivo de 200 KB.
- Vehículo: máximo aproximado de 1280 × 960 px y objetivo de 500 KB.
- Identificación: máximo aproximado de 1600 px y objetivo de 900 KB.
- Conversión automática a WebP o JPEG, corrección de orientación y vista previa.

## Instalación

1. Haz una copia de respaldo del repositorio y de Supabase.
2. Reemplaza en GitHub todos los archivos del proyecto con el contenido de este ZIP.
3. En Supabase abre **SQL Editor → New query**.
4. Copia y ejecuta una sola vez `ACTUALIZAR_SUPABASE_v2.7.0.sql`.
5. No ejecutes los archivos guardados en `SQL_ANTERIORES`.
6. Espera la publicación de GitHub Pages y recarga completamente la aplicación.

## Enlaces

- Pasajero: `https://joserpm169107-droid.github.io/Rueda/`
- Conductor: `https://joserpm169107-droid.github.io/Rueda/conductor.html`
- Administrador: `https://joserpm169107-droid.github.io/Rueda/admin.html`

## Nota técnica

La llamada privada es audio por internet mediante WebRTC y señalización de Supabase Realtime; no abre la aplicación telefónica ni revela los números. Su funcionamiento puede depender de permisos del micrófono y de la red disponible. La migración y las operaciones deben probarse contra el proyecto real de Supabase después de instalar esta versión.
