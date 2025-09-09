async function cargarJSON(ruta){ const r = await fetch(ruta); return r.json(); }
function $(sel){ return document.querySelector(sel); }

async function init(){
  const [productos, usuarios, ventas] = await Promise.all([
    cargarJSON('data/productos.json'),
    cargarJSON('data/usuarios.json'),
    cargarJSON('data/ventas.json'),
  ]);

  // Render productos
const prodEl = $('#productos');
prodEl.innerHTML = productos.map(p => `
  <article class="card">
    <img class="card-img" src="${p.imagen}" alt="${p.nombre}"
         onerror="this.style.display='none'">
    <div class="badge">${p.activo ? 'Activo' : 'Inactivo'}</div>
    <h3>${p.nombre}</h3>
    <p>${p.desc}</p>
    <div class="price">$ ${p.precio.toLocaleString('es-AR')}</div>
  </article>
`).join('');


  // Render usuarios
  const usersEl = $('#usuarios');
  usersEl.innerHTML = `
    <thead>
      <tr><th>ID</th><th>Nombre</th><th>Apellido</th><th>Email</th><th>Activo</th></tr>
    </thead>
    <tbody>
      ${usuarios.map(u => `
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

  // Crear mapa de productos por id
  const prodMap = Object.fromEntries(productos.map(p => [p.id, p]));

  // Render ventas
  const ventasEl = $('#ventas');
  ventasEl.innerHTML = ventas.map(v => {
    const user = usuarios.find(u => u.id === v.id_usuario);
    const items = v.productos.map(it => {
      const p = prodMap[it.id_producto];
      const linea = it.cantidad * it.precio_unitario;
      return `<li>${p?.nombre ?? it.id_producto} × ${it.cantidad} — $ ${linea.toLocaleString('es-AR')}</li>`;
    }).join('');
    return `
      <div class="venta">
        <h4>Venta #${v.id} — ${new Date(v.fecha).toLocaleString('es-AR')} <span class="tag">${v.pagado ? 'Pagado' : 'Pendiente'}</span></h4>
        <div><strong>Cliente:</strong> ${user ? user.nombre + ' ' + user.apellido : 'Desconocido'} — <strong>Total:</strong> $ ${v.total.toLocaleString('es-AR')}</div>
        <div><strong>Dirección:</strong> ${v.direccion}</div>
        <ul>${items}</ul>
      </div>
    `;
  }).join('');
}

init();
