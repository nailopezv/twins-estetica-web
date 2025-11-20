async function cargarJSON(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error('Error al cargar ' + ruta);
  return r.json();
}

function $(sel) {
  return document.querySelector(sel);
}

// ====== Estado global ======
let productosGlobal = [];
let usuariosGlobal = [];
let ventasGlobal = [];
let carrito = [];

// ====== Carrito en localStorage ======
const LS_KEY_CARRITO = 'carritoTwins';

function cargarCarritoDesdeLocalStorage() {
  try {
    const guardado = localStorage.getItem(LS_KEY_CARRITO);
    carrito = guardado ? JSON.parse(guardado) : [];
  } catch (e) {
    console.error('Error al leer carrito de localStorage', e);
    carrito = [];
  }
}

function guardarCarrito() {
  try {
    localStorage.setItem(LS_KEY_CARRITO, JSON.stringify(carrito));
  } catch (e) {
    console.error('Error al guardar carrito en localStorage', e);
  }
}

// ====== Utilidades ======
function formatearPrecio(valor) {
  const num = Number(valor) || 0;
  return '$ ' + num.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return '-';
  const fecha = new Date(fechaIso);
  if (isNaN(fecha.getTime())) return fechaIso;
  return fecha.toLocaleDateString('es-AR') + ' ' +
         fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

// ====== Productos ======
function renderProductos(categoria = 'todas') {
  const cont = $('#productos');
  let lista = productosGlobal;

  if (categoria !== 'todas') {
    lista = lista.filter(p => p.categoria === categoria);
  }

  cont.innerHTML = lista.map(p => `
    <article class="card">
      ${p.imagen ? `<img class="card-img" src="${p.imagen}" alt="${p.nombre}" onerror="this.style.display='none'">` : ''}
      <div class="badge">${p.activo ? 'Activo' : 'Inactivo'}</div>
      <h3>${p.nombre}</h3>
      <p>${p.desc || ''}</p>
      <div class="price">${formatearPrecio(p.precio)}</div>
      <small class="muted">Categoría: ${p.categoria || '-'}</small><br>
      <button class="btn btn-add" data-id="${p.id}">Agregar al carrito</button>
    </article>
  `).join('');
}

// ====== Usuarios ======
function renderUsuarios() {
  const usersEl = $('#usuarios');
  if (!usersEl) return;

  usersEl.innerHTML = `
    <thead>
      <tr><th>ID</th><th>Nombre</th><th>Apellido</th><th>Email</th><th>Activo</th></tr>
    </thead>
    <tbody>
      ${usuariosGlobal.map(u => `
        <tr>
          <td>${u.id}</td>
          <td>${u.nombre}</td>
          <td>${u.apellido}</td>
          <td>${u.email}</td>
          <td>${u.activo ? 'Sí' : 'No'}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
}

function popularSelectCategorias() {
  const select = $('#categoriaSelect');
  if (!select) return;

  // Dejar opción "todas" fija
  select.innerHTML = '<option value="todas">Todas</option>';

  const categorias = Array.from(new Set(productosGlobal.map(p => p.categoria))).filter(Boolean);
  categorias.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function popularSelectUsuarios() {
  const sel = $('#usuarioSelect');
  if (!sel) return;

  sel.innerHTML = '<option value="">Seleccioná un usuario...</option>';
  usuariosGlobal.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.nombre} ${u.apellido}`;
    sel.appendChild(opt);
  });
}

// ====== Ventas ======
function calcularTotalVenta(venta) {
  if (typeof venta.total === 'number') return venta.total;
  const items = venta.productos || venta.items || [];
  return items.reduce((acc, it) => {
    const precio = Number(it.precio_unitario ?? it.precioUnitario ?? 0);
    const cant = Number(it.cantidad) || 0;
    return acc + precio * cant;
  }, 0);
}

function renderVentas(lista = ventasGlobal) {
  const contenedor = document.getElementById('ventas-lista');
  if (!contenedor) return;

  if (!lista || lista.length === 0) {
    contenedor.innerHTML = '<p>Todavía no registraste ventas.</p>';
    return;
  }

  contenedor.innerHTML = '';

  lista.forEach(venta => {
    const card = document.createElement('article');
    card.className = 'venta-card';

    const usuario = usuariosGlobal.find(u => u.id === venta.id_usuario);
    const nombreCliente = usuario
      ? `${usuario.nombre} ${usuario.apellido}`
      : (venta.cliente || `Usuario #${venta.id_usuario ?? '-'}`);

    const items = venta.productos || venta.items || [];
    const itemsHtml = items.map(item => {
      const prod = productosGlobal.find(p => p.id === item.id_producto);
      const nombreProd = item.nombre || (prod ? prod.nombre : `Producto #${item.id_producto ?? '-'}`);
      const precio = Number(item.precio_unitario ?? item.precioUnitario ?? 0);
      const cant = Number(item.cantidad) || 0;
      return `<li>${nombreProd} × ${cant} — ${formatearPrecio(precio)}</li>`;
    }).join('');

    const total = calcularTotalVenta(venta);
    const fecha = formatearFecha(venta.fecha);

    card.innerHTML = `
      <p><strong>Venta #${venta.id}</strong> — ${fecha}</p>
      <p><strong>Cliente:</strong> ${nombreCliente} — <strong>Total:</strong> ${formatearPrecio(total)}</p>
      <p><strong>Dirección:</strong> ${venta.direccion || '-'}</p>
      <ul>${itemsHtml}</ul>
    `;

    contenedor.appendChild(card);
  });
}

// ====== Carrito ======
function renderCarrito() {
  const cont = $('#carrito');
  const vacio = $('#carritoVacio');
  const acciones = $('#carritoAcciones');
  const countSpan = $('#cartCount');

  if (!cont || !vacio || !acciones || !countSpan) {
    console.warn('Elementos del carrito no encontrados en el DOM');
    return;
  }

  if (!Array.isArray(carrito)) carrito = [];

  if (carrito.length === 0) {
    vacio.style.display = 'block';
    acciones.style.display = 'none';
    cont.innerHTML = '';
    countSpan.textContent = '0';
    return;
  }

  vacio.style.display = 'none';
  acciones.style.display = 'block';

  const totalItems = carrito.reduce((acc, i) => acc + i.cantidad, 0);
  countSpan.textContent = totalItems.toString();

  let total = 0;
  cont.innerHTML = carrito.map(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    return `
      <div class="carrito-item">
        <div>
          <strong>${item.nombre}</strong>
          <span>${item.cantidad} × ${formatearPrecio(item.precio)}</span>
        </div>
        <div>
          <span class="carrito-subtotal">${formatearPrecio(subtotal)}</span>
          <button class="btn btn-sm" data-accion="menos" data-id="${item.id}">-</button>
          <button class="btn btn-sm" data-accion="mas" data-id="${item.id}">+</button>
          <button class="btn btn-sm btn-danger" data-accion="borrar" data-id="${item.id}">Quitar</button>
        </div>
      </div>
    `;
  }).join('') + `
    <div class="carrito-total">Total: ${formatearPrecio(total)}</div>
  `;
}

// ====== Comprar ======
async function realizarCompra() {
  const msgEl = document.getElementById('carritoMensaje');

  // Limpiar mensaje anterior
  if (msgEl) {
    msgEl.textContent = '';
    msgEl.classList.remove('mensaje-ok', 'mensaje-error');
  }

  if (!carrito.length) {
    if (msgEl) {
      msgEl.textContent = 'El carrito está vacío.';
      msgEl.classList.add('mensaje-error');
    }
    return;
  }

  const selectUsuario = document.getElementById('usuarioSelect');
  const usuarioId = Number(selectUsuario && selectUsuario.value);

  if (!usuarioId) {
    if (msgEl) {
      msgEl.textContent = 'Seleccioná un usuario para la compra.';
      msgEl.classList.add('mensaje-error');
    }
    return;
  }

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  const productos = carrito.map(p => ({
    id_producto: p.id,
    cantidad: p.cantidad,
    precio_unitario: p.precio
  }));

  const body = {
    id_usuario: usuarioId,
    productos,
    total,
    direccion: 'Sin dirección',
    pagado: true
  };

  try {
  const resp = await fetch('/api/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.mensaje || err.error || 'Error al registrar la venta');
  }

  const data = await resp.json();
  const ventaCreada = data.venta || data;

  // ✅ POPUP INMEDIATO
  alert(`Compra registrada correctamente (venta #${ventaCreada.id}).`);

  // ✅ Mensaje debajo del botón (como ya tenías)
  if (msgEl) {
    msgEl.textContent = `Compra registrada correctamente (venta #${ventaCreada.id}).`;
    msgEl.classList.add('mensaje-ok');
  }

  ventasGlobal.push(ventaCreada);
  renderVentas();

  carrito = [];
  guardarCarrito();
  renderCarrito();

} catch (err) {
  console.error(err);
  if (msgEl) {
    msgEl.textContent = 'Error al registrar la compra: ' + err.message;
    msgEl.classList.add('mensaje-error');
  }
}
}

// ====== Eventos ======
function registrarEventos() {
  const selCat = $('#categoriaSelect');
  if (selCat) {
    selCat.addEventListener('change', e => {
      renderProductos(e.target.value);
    });
  }

  // Agregar productos al carrito (delegación)
  const productosDiv = $('#productos');
  if (productosDiv) {
    productosDiv.addEventListener('click', e => {
      const btn = e.target.closest('button[data-id]');
      if (!btn) return;

      const id = Number(btn.dataset.id);
      const prod = productosGlobal.find(p => p.id === id);
      if (!prod) return;

      const existente = carrito.find(i => i.id === id);
      if (existente) existente.cantidad++;
      else carrito.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1 });

      guardarCarrito();
      renderCarrito();
    });
  }

  // Modificar carrito
  const carritoDiv = $('#carrito');
  if (carritoDiv) {
    carritoDiv.addEventListener('click', e => {
      const btn = e.target.closest('button[data-accion]');
      if (!btn) return;

      const id = Number(btn.dataset.id);
      const accion = btn.dataset.accion;
      const item = carrito.find(i => i.id === id);
      if (!item) return;

      if (accion === 'mas') item.cantidad++;
      else if (accion === 'menos') {
        item.cantidad--;
        if (item.cantidad <= 0) {
          carrito = carrito.filter(i => i.id !== id);
        }
      } else if (accion === 'borrar') {
        carrito = carrito.filter(i => i.id !== id);
      }

      guardarCarrito();
      renderCarrito();
    });
  }

  const btnComprar = $('#comprarBtn');
  if (btnComprar) {
    btnComprar.addEventListener('click', realizarCompra);
  }
}

// ====== Init ======
async function init() {
  try {
    const [productos, usuarios, ventas] = await Promise.all([
      cargarJSON('/api/productos'),
      cargarJSON('/api/usuarios'),
      cargarJSON('/api/ventas')
    ]);

    productosGlobal = productos;
    usuariosGlobal = usuarios;
    ventasGlobal = ventas;

    cargarCarritoDesdeLocalStorage();

    popularSelectCategorias();
    popularSelectUsuarios();

    renderProductos('todas');
    renderUsuarios();
    renderCarrito();
    renderVentas();

    registrarEventos();
  } catch (e) {
    console.error(e);
    alert('Error al inicializar la aplicación: ' + e.message);
  }
}

init();
