const sql = require('../config/db');

/**
 * @swagger
 * /api/doces:
 *   get:
 *     summary: Lista todos os doces
 *     tags: [Doces]
 *     responses:
 *       200:
 *         description: Lista de doces retornada com sucesso
 */
// Listar todos os doces (GET /api/doces)
exports.listarTodos = async (req, res) => {
    try {
        const doces = await sql`SELECT * FROM doces ORDER BY id ASC`;
        res.json(doces);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar doces no banco de dados.' });
    }
};

// Buscar um doce específico pelo ID (GET /api/doces/:id)
exports.buscarPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const doce = await sql`SELECT * FROM doces WHERE id = ${id}`;

        if (doce.length === 0) {
            return res.status(404).json({ erro: 'Doce não encontrado.' });
        }
        
        res.json(doce[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar o doce.' });
    }
};

/**
 * @swagger
 * /api/doces:
 *   post:
 *     summary: Cria um novo doce
 *     tags: [Doces]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               preco:
 *                 type: number
 *               imagem:
 *                 type: string
 *     responses:
 *       201:
 *         description: Doce criado
 */
// Criar um novo doce (POST /api/doces)
exports.criar = async (req, res) => {
    try {
        const { nome, descricao, preco, imagem } = req.body;

        if (!nome || !preco) {
            return res.status(400).json({ erro: 'Nome e preço são obrigatórios.' });
        }

        // O RETURNING * traz o objeto recém-criado, incluindo o ID gerado pelo banco
        const novoDoce = await sql`
            INSERT INTO doces (nome, descricao, preco, imagem)
            VALUES (${nome}, ${descricao}, ${preco}, ${imagem || null})
            RETURNING *
        `;

        res.status(201).json(novoDoce[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar o doce no banco.' });
    }
};

/**
 * @swagger
 * /api/doces/{id}:
 *   put:
 *     summary: Atualiza um doce existente
 *     tags: [Doces]
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
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               preco:
 *                 type: number
 *               ativo:
 *                 type: boolean
 *               imagem:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doce atualizado
 */
// Atualizar um doce existente (PUT /api/doces/:id)
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, ativo, imagem } = req.body;

        // Verifica se o doce existe antes de atualizar
        const doceExistente = await sql`SELECT id FROM doces WHERE id = ${id}`;
        if (doceExistente.length === 0) {
            return res.status(404).json({ erro: 'Doce não encontrado para atualização.' });
        }

        const doceAtualizado = await sql`
            UPDATE doces
            SET 
                nome = COALESCE(${nome}, nome),
                descricao = COALESCE(${descricao}, descricao),
                preco = COALESCE(${preco}, preco),
                ativo = COALESCE(${ativo}, ativo),
                imagem = COALESCE(${imagem}, imagem)
            WHERE id = ${id}
            RETURNING *
        `;

        res.json(doceAtualizado[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar o doce.' });
    }
};

// Remover um doce (DELETE /api/doces/:id)
exports.remover = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await sql`
            DELETE FROM doces WHERE id = ${id}
            RETURNING id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Doce não encontrado para exclusão.' });
        }

        res.json({ mensagem: 'Doce removido com sucesso!' });
    } catch (erro) {
        console.error(erro);
        // Caso o doce esteja sendo usado em um combo ou pedido (chave estrangeira)
        res.status(500).json({ erro: 'Erro ao remover o doce. Verifique se ele não está vinculado a um combo ou venda.' });
    }
};