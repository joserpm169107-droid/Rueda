# Sobre Ruedas v1.5.0 — Rutas Cuba

## Qué se corrigió
La aplicación ya no dibuja una línea ficticia hacia un punto fijo.

Ahora intenta:
1. Interpretar direcciones cubanas como:
   - Calle A entre Marcial Gómez y Abraham Delgado
   - Martí entre Independencia y Joaquín Agüero
2. Localizar las dos intersecciones de la cuadra.
3. Colocar el destino aproximadamente entre ambas esquinas.
4. Calcular una ruta real siguiendo las calles.
5. Usar un perfil distinto según el vehículo.

## Perfiles de ruta
- Bicitaxi: ruta de bicicleta, velocidad moderada y menor preferencia por vías principales.
- Motorina: perfil de motor scooter.
- Moto: perfil de motocicleta.
- Triciclo: perfil lento de motor scooter.

## Alternativa cuando una calle no aparece
Pulsa **Marcar en mapa**, mueve el mapa hasta el destino y confirma. Esto es importante porque la calidad de las direcciones depende de cómo estén registradas las calles en OpenStreetMap.

## Servicios utilizados en esta beta
- OpenStreetMap para los datos del mapa.
- Nominatim para buscar lugares y calles.
- Overpass para intentar encontrar intersecciones.
- Valhalla para rutas según el tipo de vehículo.
- OSRM como ruta de respaldo.

## Limitaciones de esta beta
- Necesita internet.
- Los servicios públicos pueden demorarse o limitar muchas consultas.
- Una vía solo puede evitarse correctamente si sus restricciones están registradas en OpenStreetMap.
- Para producción se necesitará un servidor propio, caché y una base local de direcciones cubanas verificadas.
- Los precios continúan siendo únicamente de prueba.

## Cómo instalar en GitHub
1. Descomprime el ZIP.
2. Reemplaza todos los archivos del repositorio.
3. Haz Commit.
4. Espera unos minutos.
5. Abre la aplicación agregando `?v=150` a la dirección.
