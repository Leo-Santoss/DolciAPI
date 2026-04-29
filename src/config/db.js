const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

// Inicializa a conexão com a URL do seu .env
const sql = neon(process.env.DATABASE_URL);

// Exporta o objeto 'sql' para ser usado nos controllers
module.exports = sql;