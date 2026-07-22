# Rueda v1.3.0 Verificación

## Novedad principal: mapa más grande
La barra inferior ahora se puede arrastrar con el dedo:

- Hacia abajo para ver más mapa.
- Hacia arriba para ver todas las opciones.
- Tiene tres posiciones: recogida, media y expandida.
- Al comenzar un viaje, el panel baja automáticamente para mostrar mejor la ruta.
- Un doble toque sobre la agarradera alterna entre abierto y recogido.

## Registro de conductor simplificado
Ya no se solicitan varios números de documentos.

El conductor completa:
- Nombre.
- Correo.
- Teléfono.
- Contraseña.
- Tipo de vehículo.
- Una foto de identificación oficial:
  - Carné de identidad.
  - Licencia de conducción.
  - Otro documento oficial.
- Aceptación para que Rueda revise la foto.

La solicitud queda en estado **Pendiente de revisión**.

## Importante
En esta versión la imagen se previsualiza en el teléfono, pero todavía no se guarda en un servidor. La carga real y la aprobación desde otro dispositivo se conectarán posteriormente con Firebase Storage y Firestore.

## Subir a GitHub
1. Descomprime el ZIP.
2. Reemplaza todos los archivos del repositorio.
3. Pulsa **Commit changes**.
4. Espera unos minutos.
5. Abre la aplicación agregando `?v=130` al final de la dirección.
