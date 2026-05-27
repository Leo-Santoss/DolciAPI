const sql = require('../config/db');

/**
 * @swagger
 * /api/estoque/doces:
 *   get:
 *     summary: Listar o estoque de todos os doces
 *     tags: [EstoqueDoces]
 *     responses:
 *       200:
 *         description: Sucesso
 */
// GET /api/estoque/doces - Listar o estoque de todos os doces
exports.listarTodos = async (req, res) => {
    try {
        const estoque = await sql`
            SELECT 
                e.doce_id, d.nome AS nome_doce, e.quantidade_pronta, e.atualizado_em
            FROM estoque_doces e
            JOIN doces d ON e.doce_id = d.id
            ORDER BY e.quantidade_pronta ASC
        `;
        res.json(estoque);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar o estoque de doces.' });
    }
};

/**
 * @swagger
 * /api/estoque/doces/{doceId}:
 *   get:
 *     summary: Buscar o estoque de um doce específico
 *     tags: [EstoqueDoces]
 *     parameters:
 *       - in: path
 *         name: doceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sucesso
 */
// GET /api/estoque/doces/:doceId - Buscar o estoque de um doce específico
exports.buscarPorDoce = async (req, res) => {
    try {
        const { doceId } = req.params;
        const estoque = await sql`
            SELECT 
                e.doce_id, d.nome AS nome_doce, e.quantidade_pronta, e.atualizado_em
            FROM estoque_doces e
            JOIN doces d ON e.doce_id = d.id
            WHERE e.doce_id = ${doceId}
        `;

        if (estoque.length === 0) {
            return res.status(404).json({ erro: 'Registro de estoque não encontrado para este doce.' });
        }
        
        res.json(estoque[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar o estoque.' });
    }
};

/**
 * @swagger
 * /api/estoque/doces:
 *   post:
 *     summary: Definir a quantidade exata em estoque (Cria se não existir, atualiza se existir)
 *     tags: [EstoqueDoces]
 *     responses:
 *       200:
 *         description: Sucesso
 */
// POST /api/estoque/doces - Definir a quantidade exata em estoque (Cria se não existir, atualiza se existir)
exports.definirEstoque = async (req, res) => {
    try {
        const { doce_id, quantidade_pronta } = req.body;

        if (!doce_id || quantidade_pronta === undefined) {
            return res.status(400).json({ erro: 'O ID do doce e a quantidade pronta são obrigatórios.' });
        }

        // Verifica se o doce existe na tabela principal
        const doceExiste = await sql`SELECT id FROM doces WHERE id = ${doce_id}`;
        if (doceExiste.length === 0) {
            return res.status(404).json({ erro: 'Doce não encontrado.' });
        }

        // O comando ON CONFLICT exige que a coluna seja uma restrição única ou PK (que é o caso do doce_id nesta tabela)
        const estoque = await sql`
            INSERT INTO estoque_doces (doce_id, quantidade_pronta)
            VALUES (${doce_id}, ${quantidade_pronta})
            ON CONFLICT (doce_id) 
            DO UPDATE SET 
                quantidade_pronta = EXCLUDED.quantidade_pronta,
                atualizado_em = CURRENT_TIMESTAMP
            RETURNING *
        `;

        res.status(201).json(estoque[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao definir o estoque.' });
    }
};

/**
 * @swagger
 * /api/estoque/doces/{doceId}/movimentar:
 *   put:
 *     summary: Adicionar ou Subtrair do estoque (Ex: +10 ou -5)
 *     tags: [EstoqueDoces]
 *     parameters:
 *       - in: path
 *         name: doceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sucesso
 */
// PUT /api/estoque/doces/:doceId/movimentar - Adicionar ou Subtrair do estoque (Ex: +10 ou -5)
exports.movimentar = async (req, res) => {
    try {
        const { doceId } = req.params;
        const { quantidade } = req.body; // Número positivo para entrada, negativo para saída

        if (quantidade === undefined || quantidade === 0) {
            return res.status(400).json({ erro: 'Informe uma quantidade válida diferente de zero para movimentar.' });
        }

        const estoqueAtualizado = await sql`
            UPDATE estoque_doces
            SET 
                quantidade_pronta = quantidade_pronta + ${quantidade},
                atualizado_em = CURRENT_TIMESTAMP
            WHERE doce_id = ${doceId}
            RETURNING *
        `;

        if (estoqueAtualizado.length === 0) {
            return res.status(404).json({ erro: 'Estoque não inicializado para este doce. Use o método POST primeiro.' });
        }

        res.json({
            mensagem: 'Movimentação realizada com sucesso.',
            estoque: estoqueAtualizado[0]
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao movimentar o estoque.' });
    }
};

/**
 * @swagger
 * /api/estoque/doces/{doceId}:
 *   delete:
 *     summary: Remover o controle de estoque de um doce
 *     tags: [EstoqueDoces]
 *     parameters:
 *       - in: path
 *         name: doceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sucesso
 */
// DELETE /api/estoque/doces/:doceId - Remover o controle de estoque de um doce
exports.remover = async (req, res) => {
    try {
        const { doceId } = req.params;

        const resultado = await sql`
            DELETE FROM estoque_doces WHERE doce_id = ${doceId}
            RETURNING doce_id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Registro de estoque não encontrado para exclusão.' });
        }

        res.json({ mensagem: 'Controle de estoque deste doce removido com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover o estoque.' });
    }
};