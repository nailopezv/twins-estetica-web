const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

// Paths a los JSON
const dataDir     = path.join(__dirname, 'data');
const fUsuarios  = path.join(dataDir, 'usuarios.json');
const fProductos = path.join(dataDir, 'productos.json');
const fVentas    = path.join(dataDir, 'ventas.json');

// Helpers para leer/escribir JSON
function loadJson(fileName) {
  const filePath = path.join(__dirname, 'data', fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function saveJson(fileName, data) {
  const filePath = path.join(__dirname, 'data', fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}
/*  2 GET para consultar datos  */

// GET /api/productos
app.get('/api/productos', (req, res) => {
  try {
    const productos = loadJson('productos.json');
    res.json(productos);
  } catch (err) {
    console.error('Error al leer productos:', err);
    res.status(500).send('Error al leer productos');
  }
});


// GET /api/usuarios
app.get('/api/usuarios', (req, res) => {
  try {
    const usuarios = loadJson('usuarios.json');
    res.json(usuarios);
  } catch (err) {
    console.error('Error al leer usuarios:', err);
    res.status(500).send('Error al leer usuarios');
  }
});

// (extra) GET /api/ventas -> lista de ventas
app.get('/api/ventas', (req, res) => {
  try {
    const ventas = loadJson('ventas.json');
    res.json(ventas);
  } catch (err) {
    console.error('Error al leer ventas:', err);
    res.status(500).send('Error al leer ventas');
  }
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
app.post('/api/ventas', (req, res) => {
  try {
    const { id_usuario, productos, total, direccion, pagado, fecha } = req.body;

    if (!id_usuario || !productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: 'Datos de compra incompletos' });
    }

    const ventas = loadJson('ventas.json');

    const nuevaVenta = {
      id: Date.now(),
      id_usuario,
      fecha: fecha || new Date().toISOString(),
      total,
      direccion: direccion || '',
      productos,
      pagado: pagado ?? true
    };

    ventas.push(nuevaVenta);
    saveJson('ventas.json', ventas);

    res.json({ mensaje: 'Compra registrada correctamente', venta: nuevaVenta });
  } catch (err) {
    console.error('Error al registrar compra:', err);
    res.status(500).json({ mensaje: 'Error al registrar la compra' });
  }
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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// Arrancar servidor
app.listen(PORT, () => {
  console.log(`API de Twins Estética escuchando en http://localhost:${PORT}`);
});
app.post('/api/comprar', (req, res) => {
  const { usuario, productos, total } = req.body;

});

