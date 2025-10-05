const express = require("express");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// --- LOGIN ---
app.post("/api/v1/auth", (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.status(200).json({ token });
  }

  res.status(400).json({ error: "invalid credentials" });
});

// --- MIDDLEWARE DE AUTENTICACIÓN ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token requerido" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: "Token inválido o expirado" });
    req.user = user;
    next();
  });
}

// --- CONSULTA DE POKÉMON ---
app.post("/api/v1/pokemonDetails", authenticateToken, async (req, res) => {
  const { pokemonName } = req.body;

  if (!pokemonName) {
    return res.status(400).json({ error: "Debes enviar un nombre de Pokémon" });
  }

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);

    if (!response.ok) {
      return res.status(400).json({ error: "Pokémon no encontrado" });
    }

    const data = await response.json();

    // 🟢 Convertir peso a kilogramos
    const pesoKg = (data.weight * 0.1).toFixed(1);

    res.status(200).json({
      name: data.name,
      species: data.species.name,
      weight: `${pesoKg} kg`, // Mostrar peso en kg
      img_url: data.sprites.front_default,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
