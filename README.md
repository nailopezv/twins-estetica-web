# Twins Estética — Primera entrega (JSON + Web)

Este proyecto incluye 3 estructuras de datos en formato JSON (**usuarios**, **productos**, **ventas**) para una estitica llamada **Twins Estetica**

## Estructura
- `usuarios.json`: `{id, nombre, apellido, email, contraseña, activo}`: contiene datos de los clientes.
- `productos.json`: `{id, nombre, desc, precio, imagen, activo}`: lista de productos/servicios que ofrecen.
- `ventas.json`: `{id, id_usuario, fecha, total, dirección, productos[], pagado}`: registra las ventas, viculando usuarios y productos.
  - `productos[]`: `{id_producto, cantidad, precio_unitario}`

Incluyen **numéricos**, **cadenas** y **booleanos**, y mantienen coherencia entre sí (ids referenciados).

**Demo online:** https://nailopezv.github.io/twins-estetica-web/
