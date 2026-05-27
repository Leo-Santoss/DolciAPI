const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
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

// Configuração do Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Dolci API',
            version: '1.0.0',
            description: 'API Oficial da loja de doces Dolci.',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: [
        path.join(__dirname, './routes/*.js'), 
        path.join(__dirname, './controllers/*.js')
    ], // Apontando para as rotas onde as anotações do swagger ficarão
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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