# Twins Estética — Primera entrega (JSON + Web)

Este proyecto incluye 3 estructuras de datos en formato JSON (**usuarios**, **productos**, **ventas**) para una estitica llamada **Twins Estetica**

## Estructura
- `usuarios.json`: `{id, nombre, apellido, email, contraseña, activo}`: contiene datos de los clientes.
- `productos.json`: `{id, nombre, desc, precio, imagen, activo}`: lista de productos/servicios que ofrecen.
- `ventas.json`: `{id, id_usuario, fecha, total, dirección, productos[], pagado}`: registra las ventas, viculando usuarios y productos.
  - `productos[]`: `{id_producto, cantidad, precio_unitario}`

Incluyen **numéricos**, **cadenas** y **booleanos**, y mantienen coherencia entre sí (ids referenciados).

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

```

---

## Tercera entrega - Carrito de compras + Servidor Express

Se conecta a un servidor con una interfaz web usando HTML, CSS, JavaScript y Node.js con Express.

## Funcionalidades implementadas

### Listado de productos
- Se cargan desde el servidor mediante `/api/productos`.
- Se muestran en tarjetas con nombre, precio, descripción e imagen.

### Filtrado por categoría
- Un selector permite borrar por categoría sin recargar la página.

### Carrito de compras
- Agregar productos
- Aumentar, disminuir o quitar
- Se guarda automáticamente en **localStorage**
- Se muestra el total actualizado

### Selección de usuario comprador
- Selector dinámico cargado desde `/api/usuarios`.

### Realizar compra
- Enviar compra al backend mediante `POST /api/ventas`
- Genera:
  - id de venta
  - usuario comprador
  - productos comprados
  - totales
  - fecha automática
- La venta se **guarda en `ventas.json`**.
- Se actualiza en pantalla de forma instantánea.

### Listado de ventas
- Muestra todas las ventas guardadas en el backend.
- Incluye:
  - fecha formateada
  - cliente
  - dirección
  - detalle de productos
  - total de la compra

---

