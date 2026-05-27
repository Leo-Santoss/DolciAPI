const sql = require('../config/db');

/**
 * @swagger
 * /api/estoque/ingredientes:
 *   get:
 *     summary: Listar todos os ingredientes
 *     tags: [EstoqueIngredientes]
 *     responses:
 *       200:
 *         description: Sucesso
 */
// GET /api/estoque/ingredientes - Listar todos os ingredientes
exports.listarTodos = async (req, res) => {
    try {
        const ingredientes = await sql`
            SELECT * FROM estoque_ingredientes 
            ORDER BY nome ASC
        `;
        res.json(ingredientes);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar ingredientes.' });
    }
};

/**
 * @swagger
 * /api/estoque/ingredientes/{id}:
 *   get:
 *     summary: Buscar um ingrediente específico
 *     tags: [EstoqueIngredientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sucesso
 */
// GET /api/estoque/ingredientes/:id - Buscar um ingrediente específico
exports.buscarPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const ingrediente = await sql`
            SELECT * FROM estoque_ingredientes WHERE id = ${id}
        `;

        if (ingrediente.length === 0) {
            return res.status(404).json({ erro: 'Ingrediente não encontrado.' });
        }
        
        res.json(ingrediente[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar o ingrediente.' });
    }
};

/**
 * @swagger
 * /api/estoque/ingredientes:
 *   post:
 *     summary: Cadastrar um novo ingrediente
 *     tags: [EstoqueIngredientes]
 *     responses:
 *       200:
 *         description: Sucesso
 */
// POST /api/estoque/ingredientes - Cadastrar um novo ingrediente
exports.criar = async (req, res) => {
    try {
        const { nome, unidade_medida, quantidade_atual, estoque_minimo } = req.body;

        if (!nome || !unidade_medida) {
            return res.status(400).json({ erro: 'Nome e unidade de medida (ex: kg, g, un) são obrigatórios.' });
        }

        const novoIngrediente = await sql`
            INSERT INTO estoque_ingredientes (nome, unidade_medida, quantidade_atual, estoque_minimo)
            VALUES (
                ${nome}, 
                ${unidade_medida}, 
                ${quantidade_atual || 0}, 
                ${estoque_minimo || 0}
            )
            RETURNING *
        `;

        res.status(201).json(novoIngrediente[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao cadastrar o ingrediente.' });
    }
};

/**
 * @swagger
 * /api/estoque/ingredientes/{id}:
 *   put:
 *     summary: Atualizar dados cadastrais (nome, unidade)
 *     tags: [EstoqueIngredientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sucesso
 */
// PUT /api/estoque/ingredientes/:id - Atualizar dados cadastrais (nome, unidade)
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, unidade_medida, estoque_minimo } = req.body;

        const ingredienteExistente = await sql`SELECT id FROM estoque_ingredientes WHERE id = ${id}`;
        if (ingredienteExistente.length === 0) {
            return res.status(404).json({ erro: 'Ingrediente não encontrado.' });
        }

        const ingredienteAtualizado = await sql`
            UPDATE estoque_ingredientes
            SET 
                nome = COALESCE(${nome}, nome),
                unidade_medida = COALESCE(${unidade_medida}, unidade_medida),
                estoque_minimo = COALESCE(${estoque_minimo}, estoque_minimo),
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;

        res.json(ingredienteAtualizado[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar o ingrediente.' });
    }
};

/**
 * @swagger
 * /api/estoque/ingredientes/{id}/movimentar:
 *   put:
 *     summary: Somar (compra) ou Subtrair (uso)
 *     tags: [EstoqueIngredientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sucesso
 */
// PUT /api/estoque/ingredientes/:id/movimentar - Somar (compra) ou Subtrair (uso)
exports.movimentar = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantidade } = req.body; // Número positivo para entrada, negativo para saída

        if (quantidade === undefined || quantidade === 0) {
            return res.status(400).json({ erro: 'Informe uma quantidade válida para movimentar.' });
        }

        const estoqueAtualizado = await sql`
            UPDATE estoque_ingredientes
            SET 
                quantidade_atual = quantidade_atual + ${quantidade},
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;

        if (estoqueAtualizado.length === 0) {
            return res.status(404).json({ erro: 'Ingrediente não encontrado.' });
        }

        res.json({
            mensagem: 'Estoque do ingrediente atualizado com sucesso.',
            estoque: estoqueAtualizado[0]
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao movimentar o ingrediente.' });
    }
};

/**
 * @swagger
 * /api/estoque/ingredientes/{id}:
 *   delete:
 *     summary: Remover um ingrediente do sistema
 *     tags: [EstoqueIngredientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sucesso
 */
// DELETE /api/estoque/ingredientes/:id - Remover um ingrediente do sistema
exports.remover = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await sql`
            DELETE FROM estoque_ingredientes WHERE id = ${id}
            RETURNING id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Ingrediente não encontrado para exclusão.' });
        }

        res.json({ mensagem: 'Ingrediente removido com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover o ingrediente.' });
    }
};