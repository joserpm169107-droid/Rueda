# Sobre Ruedas v2.3.3

## Tarifas por kilómetro

- El precio del viaje ahora se calcula únicamente como distancia × precio por km.
- Se eliminan del cálculo la tarifa base y el precio mínimo.
- La aplicación carga los precios por km desde Supabase.
- Los cambios hechos en el panel administrativo se reflejan en la aplicación.
- Se añadió actualización en tiempo real cuando cambian las tarifas.
- El panel de administración muestra únicamente el campo Precio por km.
- La migración establece `base_fare` y `minimum_fare` en cero sin borrar viajes ni usuarios.

## Caché

- Service Worker y manifest actualizados a v2.3.3.
