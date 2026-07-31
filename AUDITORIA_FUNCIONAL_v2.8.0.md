# Auditoría funcional local — v2.8.0

## Revisado en código

- Pasajero: solicitud, recuperación de viaje, cambio automático a seguimiento, estados, mapa, cierre y calificación.
- Conductor: aprobación/operabilidad, conexión, aceptación, navegación, cierre, soporte y ganancias.
- Administración: viajes, suspensión, desactivación, reactivación, eliminación definitiva y soporte.
- Comunicación: chat asociado al viaje y llamada de audio por internet sin mostrar teléfonos.
- Fotografías: reducción y conversión antes de subir.
- Caché: cambio de versión y limpieza de cachés anteriores.

## Comprobaciones ejecutadas

- Sintaxis de `v270.js`, `v280.js`, `admin-v270.js`, `admin-v280.js` y `sw.js`.
- Sintaxis de todos los scripts incluidos dentro de `index.html`, `conductor.html` y `admin.html`.
- Existencia de todas las referencias locales de CSS, JavaScript, imágenes y manifiestos.
- Integridad del archivo ZIP.

## Límite de la auditoría

No fue posible ejecutar la migración contra la base de datos real del propietario ni simular dos teléfonos físicos con GPS, micrófono y permisos reales. Por eso `PRUEBAS_v2.8.0.md` contiene el recorrido obligatorio después de instalar.
