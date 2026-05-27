const sql = require('../config/db');

/**
 * @swagger
 * /api/receitas:
 *   get:
 *     summary: Lista todas as receitas
 *     tags: [Receitas]
 *     responses:
 *       200:
 *         description: Lista de receitas retornada com sucesso
 */
// GET /api/receitas - Listar todas as receitas (trazendo o nome do doce junto)
exports.listarTodas = async (req, res) => {
    try {
        const receitas = await sql`
            SELECT 
                r.id, r.doce_id, d.nome AS nome_doce, 
                r.modo_preparo, r.tempo_preparo_minutos, r.rendimento_porcoes, r.imagem, r.atualizado_em
            FROM receitas r
            JOIN doces d ON r.doce_id = d.id
            ORDER BY r.id ASC
        `;
        res.json(receitas);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar receitas no banco de dados.' });
    }
};

// GET /api/receitas/doce/:doceId - Buscar a receita de um doce específico
exports.buscarPorDoce = async (req, res) => {
    try {
        const { doceId } = req.params;
        const receita = await sql`
            SELECT 
                r.*, d.nome AS nome_doce
            FROM receitas r
            JOIN doces d ON r.doce_id = d.id
            WHERE r.doce_id = ${doceId}
        `;

        if (receita.length === 0) {
            return res.status(404).json({ erro: 'Receita não encontrada para este doce.' });
        }
        
        res.json(receita[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar a receita.' });
    }
};

/**
 * @swagger
 * /api/receitas:
 *   post:
 *     summary: Cria uma nova receita
 *     tags: [Receitas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doce_id:
 *                 type: integer
 *               modo_preparo:
 *                 type: string
 *               tempo_preparo_minutos:
 *                 type: integer
 *               rendimento_porcoes:
 *                 type: integer
 *               imagem:
 *                 type: string
 *     responses:
 *       201:
 *         description: Receita criada
 */
// POST /api/receitas - Criar uma nova receita vinculada a um doce
exports.criar = async (req, res) => {
    try {
        const { doce_id, modo_preparo, tempo_preparo_minutos, rendimento_porcoes, imagem } = req.body;

        if (!doce_id || !modo_preparo) {
            return res.status(400).json({ erro: 'O ID do doce e o modo de preparo são obrigatórios.' });
        }

        // Verifica se o doce existe
        const doceExiste = await sql`SELECT id FROM doces WHERE id = ${doce_id}`;
        if (doceExiste.length === 0) {
            return res.status(404).json({ erro: 'Doce não encontrado. Não é possível criar a receita.' });
        }

        // Verifica se já existe uma receita para este doce (Relação 1:1)
        const receitaExiste = await sql`SELECT id FROM receitas WHERE doce_id = ${doce_id}`;
        if (receitaExiste.length > 0) {
            return res.status(400).json({ erro: 'Este doce já possui uma receita cadastrada. Use o método PUT para atualizá-la.' });
        }

        const novaReceita = await sql`
            INSERT INTO receitas (doce_id, modo_preparo, tempo_preparo_minutos, rendimento_porcoes, imagem)
            VALUES (${doce_id}, ${modo_preparo}, ${tempo_preparo_minutos}, ${rendimento_porcoes}, ${imagem || null})
            RETURNING *
        `;

        res.status(201).json(novaReceita[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar a receita no banco.' });
    }
};

/**
 * @swagger
 * /api/receitas/{id}:
 *   put:
 *     summary: Atualiza uma receita existente
 *     tags: [Receitas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modo_preparo:
 *                 type: string
 *               tempo_preparo_minutos:
 *                 type: integer
 *               rendimento_porcoes:
 *                 type: integer
 *               imagem:
 *                 type: string
 *     responses:
 *       200:
 *         description: Receita atualizada
 */
// PUT /api/receitas/:id - Atualizar uma receita existente
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { modo_preparo, tempo_preparo_minutos, rendimento_porcoes, imagem } = req.body;

        const receitaExistente = await sql`SELECT id FROM receitas WHERE id = ${id}`;
        if (receitaExistente.length === 0) {
            return res.status(404).json({ erro: 'Receita não encontrada.' });
        }

        const receitaAtualizada = await sql`
            UPDATE receitas
            SET 
                modo_preparo = COALESCE(${modo_preparo}, modo_preparo),
                tempo_preparo_minutos = COALESCE(${tempo_preparo_minutos}, tempo_preparo_minutos),
                rendimento_porcoes = COALESCE(${rendimento_porcoes}, rendimento_porcoes),
                imagem = COALESCE(${imagem}, imagem),
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;

        res.json(receitaAtualizada[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar a receita.' });
    }
};

// DELETE /api/receitas/:id - Remover uma receita
exports.remover = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await sql`
            DELETE FROM receitas WHERE id = ${id}
            RETURNING id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Receita não encontrada para exclusão.' });
        }

        res.json({ mensagem: 'Receita removida com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover a receita.' });
    }
};