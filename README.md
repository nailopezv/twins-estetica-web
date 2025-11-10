# Twins Estética — Primera entrega (JSON + Web)

Este proyecto incluye 3 estructuras de datos en formato JSON (**usuarios**, **productos**, **ventas**) para una estitica llamada **Twins Estetica**

## Estructura
- `usuarios.json`: `{id, nombre, apellido, email, contraseña, activo}`: contiene datos de los clientes.
- `productos.json`: `{id, nombre, desc, precio, imagen, activo}`: lista de productos/servicios que ofrecen.
- `ventas.json`: `{id, id_usuario, fecha, total, dirección, productos[], pagado}`: registra las ventas, viculando usuarios y productos.
  - `productos[]`: `{id_producto, cantidad, precio_unitario}`

Incluyen **numéricos**, **cadenas** y **booleanos**, y mantienen coherencia entre sí (ids referenciados).

**Demo online:** https://nailopezv.github.io/twins-estetica-web/

---

## Segunda entrega – API con Express.js

Se agrega un servidor en **Node.js + Express** para gestionar las mismas estructuras de datos (`usuarios.json`, `productos.json`, `ventas.json`) mediante endpoints REST.

> La API se ejecuta localmente. La versión de GitHub Pages solo sirve la parte estática (HTML/CSS/JS).

### Cómo ejecutar el servidor

Requisitos: Node.js instalado.

```bash
# Clonar el repo
git clone https://github.com/nailopezv/twins-estetica-web.git
cd twins-estetica-web

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (con nodemon)
npm run dev

API local: http://localhost:3000/api/productos
