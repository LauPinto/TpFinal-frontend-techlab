const API_URL = 'http://localhost:8080/api/productos';
const PEDIDO_URL = 'http://localhost:8080/api/pedidos';

const container = document.getElementById('productos-container');
const formAgregar = document.getElementById('form-agregar');
const formPedido = document.getElementById('form-pedido');
const pedidoItemsContainer = document.getElementById('pedido-items');
const agregarItemBtn = document.getElementById('agregar-item');
const pedidosContainer = document.getElementById('pedidos-container');

let productosCache = [];

agregarItemBtn.addEventListener('click', agregarItemPedido);

function agregarItemPedido() {
  const div = document.createElement('div');
  div.classList.add('pedido-item');
  div.innerHTML = `
    <input type="number" name="productoId" class="producto-id" placeholder="ID Producto" required />
    <input type="number" name="cantidad" class="producto-cantidad" placeholder="Cantidad" required />
    <button type="button" onclick="this.parentElement.remove()">Eliminar</button>
  `;
  pedidoItemsContainer.appendChild(div);
}

async function cargarProductos() {
  try {
    const res = await fetch(API_URL);
    productosCache = await res.json();

    container.innerHTML = '';

    if (productosCache.length === 0) {
      container.textContent = 'No hay productos disponibles.';
      return;
    }

    // Crear un contenedor grid
    const grid = document.createElement('div');
    grid.classList.add('grid-productos');

    // Crear cabecera de columnas con flex o grid
    const header = document.createElement('div');
    header.classList.add('grid-header');

    header.innerHTML = `
      <div>ID</div>
      <div>Nombre</div>
      <div>Descripción</div>
      <div>Precio</div>
      <div>Categoría</div>
      <div>Imagen</div>
      <div>Stock</div>
      <div>Acciones</div>
    `;

    grid.appendChild(header);

    productosCache.forEach(p => {
      const item = document.createElement('div');
      item.classList.add('grid-row');

      item.innerHTML = `
        <div>${p.id}</div>
        <div>${p.nombre}</div>
        <div>${p.descripcion}</div>
        <div>$${p.precio.toFixed(2)}</div>
        <div>${p.categoria}</div>
        <div><img src="${p.imagen}" alt="${p.nombre}" width="60" /></div>
        <div>${p.stock}</div>
        <div><button class="btn-eliminar" onclick="eliminarProducto(${p.id})">Eliminar</button></div>
      `;

      grid.appendChild(item);
    });

    container.appendChild(grid);

  } catch (error) {
    console.error('Error cargando productos:', error);
    container.textContent = 'Error al cargar productos.';
  }
}

formAgregar.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(formAgregar).entries());
  data.precio = parseFloat(data.precio);
  data.stock = parseInt(data.stock);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Error agregando producto');

    formAgregar.reset();
    alert('Producto agregado exitosamente');
    cargarProductos();
  } catch (error) {
    console.error(error);
    alert('Error al agregar producto');
  }
});
async function eliminarProducto(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

    if (response.status === 204) {
      // Eliminado OK
      cargarProductos();
    } else if (response.status === 409) {
      // No se puede eliminar, mostramos mensaje del backend
      const mensaje = await response.text();
      alert('No se puede eliminar el producto: ' + mensaje);
    } else {
      alert('Error inesperado al eliminar producto');
    }
  } catch (error) {
    console.error(error);
    alert('Error al eliminar producto');
  }
}


formPedido.addEventListener('submit', async (e) => {
  e.preventDefault();

  const items = Array.from(pedidoItemsContainer.querySelectorAll('.pedido-item'));

  const productoIds = [];
  const cantidades = [];

  for (const item of items) {
    const id = parseInt(item.querySelector('.producto-id').value);
    const cantidad = parseInt(item.querySelector('.producto-cantidad').value);

    if (isNaN(id) || isNaN(cantidad) || cantidad <= 0) {
      alert('Por favor, ingresa IDs y cantidades válidas.');
      return;
    }

    productoIds.push(id);
    cantidades.push(cantidad);
  }

  try {
    const res = await fetch(PEDIDO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productoIds, cantidades }),
    });

    if (!res.ok) throw new Error('Error en el pedido. No existe el producto.');

    alert('¡Pedido enviado!');
    pedidoItemsContainer.innerHTML = ''; 
    agregarItemPedido(); 
    cargarPedidos(); 
  } catch (error) {
    console.error(error);
    alert(error);
  }
});


function crearMapaProductos() {
  return new Map(productosCache.map(p => [p.id, p.nombre]));
}

async function cargarPedidos() {
  try {
    const res = await fetch(PEDIDO_URL);
    if (!res.ok) throw new Error('Error al obtener pedidos');
    const pedidos = await res.json();

    pedidosContainer.innerHTML = '';

    if (pedidos.length === 0) {
      pedidosContainer.textContent = 'No hay pedidos aún.';
      return;
    }

    // Contenedor grid general
    const grid = document.createElement('div');
    grid.classList.add('grid-pedidos');

    // Header
    const header = document.createElement('div');
    header.classList.add('grid-header-pedidos');
    header.innerHTML = `
      <div>ID Pedido</div>
      <div>Fecha</div>
      <div>Productos</div>
      <div>Total</div>
    `;
    grid.appendChild(header);

    pedidos.forEach(pedido => {
      const row = document.createElement('div');
      row.classList.add('grid-row-pedido');

      const fecha = new Date(pedido.fechaCreacion).toLocaleString();

      // Crear lista de productos en formato texto
      let productosTexto = '';
      if (pedido.lineas && pedido.lineas.length > 0) {
        productosTexto = pedido.lineas.map(linea =>
          `${linea.producto.nombre} (x${linea.cantidad}) - $${linea.subtotal.toFixed(2)}`
        ).join(', ');
      } else {
        productosTexto = 'No hay detalles de productos';
      }

      row.innerHTML = `
        <div>${pedido.id}</div>
        <div>${fecha}</div>
        <div title="${productosTexto}">${productosTexto}</div>
        <div>$${pedido.total.toFixed(2)}</div>
      `;

      grid.appendChild(row);
    });

    pedidosContainer.appendChild(grid);

  } catch (error) {
    console.error(error);
    pedidosContainer.textContent = 'Error al cargar pedidos.';
  }
}

(async function inicializar() {
  await cargarProductos();
  cargarPedidos();
  agregarItemPedido();
})();
