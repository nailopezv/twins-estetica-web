const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Paths a los JSON
const dataDir     = path.join(__dirname, 'data');
const fUsuarios  = path.join(dataDir, 'usuarios.json');
const fProductos = path.join(dataDir, 'productos.json');
const fVentas    = path.join(dataDir, 'ventas.json');

// Helpers para leer/escribir JSON
async function readJSON(file) {
  const raw = await fs.readFile(file, 'utf-8');
  return JSON.parse(raw);
}
async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

/*  2 GET para consultar datos  */

// GET /api/productos
app.get('/api/productos', async (req, res) => {
  const productos = await readJSON(fProductos);
  res.json(productos);
});

// GET /api/usuarios
app.get('/api/usuarios', async (req, res) => {
  const usuarios = await readJSON(fUsuarios);
  res.json(usuarios);
});

// (extra) GET /api/ventas -> lista de ventas
app.get('/api/ventas', async (req, res) => {
  const ventas = await readJSON(fVentas);
  res.json(ventas);
});

/* 2 POST para crear registros*/

// POST /api/usuarios
app.post('/api/usuarios', async (req, res) => {
  const { nombre, apellido, email, contrasena, activo = true } = req.body;

  if (!nombre || !apellido || !email) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: nombre, apellido, email'
    });
  }

  const usuarios = await readJSON(fUsuarios);
  const nuevoId = (usuarios.at(-1)?.id || 0) + 1;

  const nuevoUsuario = {
    id: nuevoId,
    nombre,
    apellido,
    email,
    contrasena: contrasena || 'hashed_auto',
    activo: !!activo
  };

  usuarios.push(nuevoUsuario);
  await writeJSON(fUsuarios, usuarios);

  res.status(201).json(nuevoUsuario);
});

// POST /api/ventas
app.post('/api/ventas', async (req, res) => {
  const { id_usuario, direccion = '', productos = [], pagado = false, fecha } = req.body;

  if (!id_usuario || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      error: 'id_usuario y productos[] son obligatorios'
    });
  }

  const [usuarios, catalogo, ventas] = await Promise.all([
    readJSON(fUsuarios),
    readJSON(fProductos),
    readJSON(fVentas)
  ]);

  // validar usuario
  const existeUsuario = usuarios.some(u => u.id === Number(id_usuario));
  if (!existeUsuario) {
    return res.status(400).json({ error: 'id_usuario inexistente' });
  }

  // mapa de productos para validar
  const prodMap = Object.fromEntries(catalogo.map(p => [p.id, p]));

  let total = 0;
  for (const item of productos) {
    const prod = prodMap[item.id_producto];
    if (!prod) {
      return res.status(400).json({ error: `id_producto ${item.id_producto} inexistente` });
    }
    const cantidad = Number(item.cantidad || 1);
    const precio = Number(item.precio_unitario ?? prod.precio);
    item.cantidad = cantidad;
    item.precio_unitario = precio;
    total += cantidad * precio;
  }

  const nuevoId = (ventas.at(-1)?.id || 0) + 1;

  const nuevaVenta = {
    id: nuevoId,
    id_usuario: Number(id_usuario),
    fecha: fecha || new Date().toISOString(),
    total,
    direccion,
    pagado: !!pagado,
    productos
  };

  ventas.push(nuevaVenta);
  await writeJSON(fVentas, ventas);

  res.status(201).json(nuevaVenta);
});

/* 1 PUT para actualizar registros */

// PUT /api/usuarios/:id 
app.put('/api/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id);
  const cambios = req.body;

  const usuarios = await readJSON(fUsuarios);
  const index = usuarios.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const usuarioActualizado = { ...usuarios[index], ...cambios, id };
  usuarios[index] = usuarioActualizado;

  await writeJSON(fUsuarios, usuarios);
  res.json(usuarioActualizado);
});

/*  1 DELETE con integridad */

// DELETE /api/usuarios/:id
// No permite borrar si el usuario tiene ventas asociadas
app.delete('/api/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id);

  const [usuarios, ventas] = await Promise.all([
    readJSON(fUsuarios),
    readJSON(fVentas)
  ]);

  const tieneVentas = ventas.some(v => v.id_usuario === id);
  if (tieneVentas) {
    return res.status(409).json({
      error: 'No se puede eliminar el usuario: tiene ventas asociadas'
    });
  }

  const nuevosUsuarios = usuarios.filter(u => u.id !== id);
  if (nuevosUsuarios.length === usuarios.length) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  await writeJSON(fUsuarios, nuevosUsuarios);
  res.json({ ok: true });
});

/*  Servir archivos estáticos (opcional) */
app.use('/', express.static(__dirname));

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`API de Twins Estética escuchando en http://localhost:${PORT}`);
});
