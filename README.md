# Sobre Ruedas v1.5.1 — Ubicación corregida

## Error corregido
La versión anterior podía escoger una calle o intersección equivocada porque aceptaba el primer resultado disponible.

Ahora:
- No acepta una sola esquina como destino de una dirección “entre”.
- Solo calcula el centro de la cuadra cuando encuentra ambas intersecciones.
- Comprueba que ambas estén dentro de Ciego de Ávila.
- Rechaza resultados separados por más de 1.2 km.
- Muestra el pin encontrado y obliga a confirmarlo antes de trazar la ruta.
- Permite corregir el punto directamente en el mapa.
- No permite pedir el viaje mientras la salida siga siendo el punto ficticio.
- Intenta obtener el GPS real automáticamente.

## Prueba recomendada
1. Permite el acceso a la ubicación.
2. Escribe la dirección cubana.
3. Pulsa Buscar dirección cubana.
4. Revisa el pin.
5. Pulsa Usar este punto o Corregir en mapa.
6. Solo después se dibuja la ruta azul.

## Abrir
Agrega `?v=151` al final de la dirección de GitHub Pages.
