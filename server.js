const express = require("express");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

app.post("/api/v1/auth", (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.status(200).json({ token });
  }

  res.status(400).json({ error: "invalid credentials" });
});

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

    res.status(200).json({
      name: data.name,
      species: data.species.name,
      weight: data.weight,
      img_url: data.sprites.front_default,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
