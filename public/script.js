// --- TOKEN ---
let token = localStorage.getItem("sessionToken") || null;

// --- ELEMENTOS ---
const resultado = document.getElementById("resultado");

// --- DETECCIÓN DE SESIÓN AL CARGAR LA PÁGINA ---
window.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    resultado.innerHTML = `<p class="error">No hay sesión activa. Por favor inicia sesión.</p>`;
  }
});

// --- LOGIN ---
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    resultado.innerHTML = `<p class="error">Debes ingresar email y contraseña</p>`;
    return;
  }

  try {
    const res = await fetch("/api/v1/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      token = data.token;
      localStorage.setItem("sessionToken", token);
      resultado.innerHTML = `<p class="success">Login exitoso, token guardado</p>`;
    } else {
      resultado.innerHTML = `<p class="error">${data.error || "Credenciales inválidas"}</p>`;
    }
  } catch (err) {
    console.error("Error en login:", err);
    resultado.innerHTML = `<p class="error">Error de conexión con el servidor</p>`;
  }
}

// --- BUSCAR POKÉMON ---
async function buscarPokemon() {
  const pokemonName = document.getElementById("pokemon").value.trim();

  if (!token) {
    resultado.innerHTML = `<p class="error">Debes iniciar sesión primero</p>`;
    return;
  }

  if (!pokemonName) {
    resultado.innerHTML = `<p class="error">Debes ingresar un nombre de Pokémon</p>`;
    return;
  }

  try {
    const res = await fetch("/api/v1/pokemonDetails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify({ pokemonName }),
    });

    const data = await res.json();

    switch (res.status) {
      case 200:
        resultado.innerHTML = `
          <h3>${data.name}</h3>
          <p><b>Especie:</b> ${data.species}</p>
          <p><b>Peso:</b> ${data.weight}</p>
          <img src="${data.img_url}" alt="${data.name}">
        `;
        break;
      case 400:
        resultado.innerHTML = `<p class="error">${data.error}</p>`;
        break;
      case 401:
        localStorage.removeItem("sessionToken");
        token = null;
        resultado.innerHTML = `<p class="error">Sesión expirada, serás redirigido al login</p>`;
        setTimeout(() => window.location.href = "/login.html", 3000);
        break;
      case 403:
        resultado.innerHTML = `<p class="error">Usuario no autenticado</p>`;
        break;
      default:
        resultado.innerHTML = `<p class="error">Error en el servidor</p>`;
        break;
    }
  } catch (err) {
    console.error("Error en búsqueda:", err);
    resultado.innerHTML = `<p class="error">Error de conexión con el servidor</p>`;
  }
}

// --- LOGOUT ---
function logout() {
  localStorage.removeItem("sessionToken");
  token = null;
  resultado.innerHTML = `<p class="success">Sesión cerrada correctamente</p>`;
}
