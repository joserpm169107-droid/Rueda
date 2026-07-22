# Rueda v0.9.1 — Corrección del cierre de sesión

Esta compilación corrige el problema donde el botón **Cerrar sesión** no respondía o la web seguía mostrando una versión antigua.

## Correcciones
- Cierre de sesión directo y funcional.
- Confirmación nativa antes de salir.
- Limpieza de la sesión en LocalStorage y SessionStorage.
- Regreso forzado a la pantalla de acceso.
- Recarga limpia con identificador de versión.
- Service Worker actualizado para eliminar cachés antiguas.
- Número de versión visible en la sección Cuenta.

## Instalación
1. Descomprime el ZIP.
2. Reemplaza todos los archivos del repositorio en GitHub.
3. Confirma los cambios.
4. Espera de 2 a 5 minutos.
5. Abre la web agregando `?v=091` al final de la dirección la primera vez.
6. En iPhone, cierra Safari completamente y vuelve a abrir la página.

Esta versión sigue siendo una demostración local. Firebase Authentication se conectará en una etapa posterior.
