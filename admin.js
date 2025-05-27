// admin.js
const tokenKey = 'accessToken';

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://127.0.0.1:8000/api/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(tokenKey, data.access);
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      cargarPedidos();
    } else {
      alert('Credenciales incorrectas');
    }
  });
}

async function cargarPedidos() {
  const token = localStorage.getItem(tokenKey);
  const estado = document.getElementById('filtro-estado')?.value;
  const cliente = document.getElementById('filtro-cliente')?.value.trim();

  let url = 'http://127.0.0.1:8000/api/pedidos/';
  const params = [];

  if (estado) params.push(`estado=${encodeURIComponent(estado)}`);
  if (cliente) params.push(`nombre=${encodeURIComponent(cliente)}`);
  if (params.length > 0) url += '?' + params.join('&');

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'  // 👈 MUY IMPORTANTE
      }
    });

    const contentType = response.headers.get("content-type");

    if (!response.ok || !contentType.includes("application/json")) {
      const text = await response.text();  // fallback por si es HTML
      console.error("❌ Error de la API:", text);
      throw new Error("La respuesta no es JSON válido.");
    }

    const pedidos = await response.json();
    console.log("✅ Pedidos cargados:", pedidos);

    const contenedor = document.getElementById('pedidos');
    contenedor.innerHTML = '';

    if (pedidos.length === 0) {
      contenedor.innerHTML = "<p>No se encontraron pedidos para ese cliente.</p>";
      return;
    }

    pedidos.forEach(p => {
      const div = document.createElement('div');

      let itemsHtml = '<ul>';
      if (p.items && p.items.length > 0) {
        p.items.forEach(item => {
          const nombreProducto = item.producto?.nombre || 'Producto';
          const cantidad = item.cantidad || 1;
          const precio = parseFloat(item.precio || 0).toFixed(2);
          itemsHtml += `<li>${nombreProducto} - ${cantidad} x $${precio}</li>`;
        });
      }
      itemsHtml += '</ul>';

      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${p.nombre}</strong><br>
            Estado: ${p.estado}<br>
            Total: $${parseFloat(p.total).toFixed(2)}
            ${itemsHtml}
          </div>
          <button onclick="marcarAtendido(${p.id})">Atendido</button>
        </div>
      `;
      contenedor.appendChild(div);
    });

  } catch (error) {
    console.error("❌ Error al cargar pedidos:", error);
    alert("Hubo un problema al obtener los pedidos.");
  }
}

document.getElementById('filtro-estado').addEventListener('change', cargarPedidos);
document.getElementById('filtro-cliente').addEventListener('input', cargarPedidos);


async function marcarAtendido(id) {
  const token = localStorage.getItem(tokenKey);
  await fetch(`http://127.0.0.1:8000/api/pedidos/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ estado: 'atendido' })
  });
  cargarPedidos();
}

function cerrarSesion() {
  localStorage.removeItem(tokenKey);
  location.reload();
}
