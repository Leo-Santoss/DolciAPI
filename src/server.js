const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importando a conexão com o banco
const sql = require('./config/db');

// Importando as rotas
const docesRoutes = require('./routes/docesRoutes');
const combosRoutes = require('./routes/combosRoutes');
const receitasRoutes = require('./routes/receitasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const vendasRoutes = require('./routes/vendasRoutes');
const estoqueDocesRoutes = require('./routes/estoqueDocesRoutes');
const estoqueIngredientesRoutes = require('./routes/estoqueIngredientesRoutes');
const entregasRoutes = require('./routes/entregasRoutes');
const carrinhoRoutes = require('./routes/carrinhoRoutes');
const cuponsRoutes = require('./routes/cuponsRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/doces', docesRoutes);
app.use('/api/combos', combosRoutes);
app.use('/api/receitas', receitasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/estoque/doces', estoqueDocesRoutes);
app.use('/api/estoque/ingredientes', estoqueIngredientesRoutes);
app.use('/api/entregas', entregasRoutes);
app.use('/api/carrinhos', carrinhoRoutes);
app.use('/api/cupons', cuponsRoutes);

app.get('/api/db-status', async (req, res) => {
    try {
        const result = await sql`SELECT version()`;
        res.json({ 
            mensagem: 'Conexão com o banco bem-sucedida! 🐘', 
            versao_postgresql: result[0].version 
        });
    } catch (erro) {
        console.error('Erro ao conectar no banco:', erro);
        res.status(500).json({ erro: 'Falha ao conectar no banco de dados.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});