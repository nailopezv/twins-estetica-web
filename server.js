const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'cambia-este-texto-por-algo-mas-largo-y-unico';

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

const readJSON = async (filePath) => {
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    if (err.code === 'ENOENT') {
    
      return [];
    }
    throw err;
  }
};

const writeJSON = async (filePath, data) => {
  await fs.promises.writeFile(
    filePath,
    JSON.stringify(data, null, 2),
    'utf-8'
  );
};

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
  try {
    const { nombre, apellido, email, password } = req.body;

    const usuarios = await readJSON(fUsuarios);

    // hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = {
      id: (usuarios.at(-1)?.id || 0) + 1,
      nombre,
      apellido,
      email,
      passwordHash,   // ✅ guardamos el hash, NO el texto plano
      activo: true
    };

    usuarios.push(nuevoUsuario);
    await writeJSON(fUsuarios, usuarios);

    // no devolvemos el hash
    const { passwordHash: _, ...usuarioSinPass } = nuevoUsuario;

    res.status(201).json(usuarioSinPass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// POST /api/ventas

app.post('/api/ventas', authMiddleware, async (req, res) => {
  try {
    const ventas = await readJSON(fVentas);
    const { productos, total, direccion, pagado } = req.body;

    const nuevaVenta = {
      id: Date.now(),
      id_usuario: req.user.id,
      fecha: new Date().toISOString(),
      total,
      direccion: direccion || '',
      productos,
      pagado: pagado ?? true
    };

    ventas.push(nuevaVenta);
    await writeJSON(fVentas, ventas);

    res.status(201).json({ mensaje: 'Venta registrada', venta: nuevaVenta });
  } catch (err) {
    console.error('Error en /api/ventas:', err);
    res.status(500).json({ error: 'Error al registrar la venta' });
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

// POST api login

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuarios = await readJSON(fUsuarios);
    const usuario = usuarios.find(u => u.email === email);

    if (!usuario) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    let ok = false;

    // Si tiene passwordHash, lo usamos
    if (usuario.passwordHash) {
      ok = await bcrypt.compare(password, usuario.passwordHash);
    }
    // Si tiene "contraseña", vemos si ya es un hash o texto plano
    else if (usuario.contrasena) {
      const c = usuario.contrasena;

      // Si parece un hash de bcrypt (empieza con $2a o $2b), lo comparamos con bcrypt
      if (typeof c === 'string' && (c.startsWith('$2a$') || c.startsWith('$2b$'))) {
        ok = await bcrypt.compare(password, c);
      } else {
      
        ok = password === c;
      }
    }

    if (!ok) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Creamos el token
    const payload = { id: usuario.id, email: usuario.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

    const { passwordHash, contrasena, ...usuarioSinPass } = usuario;

    res.json({
      mensaje: 'Login correcto',
      token,
      usuario: usuarioSinPass
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error en login' });
  }
});


// Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user; // { id, email }
    next();
  });
}

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

