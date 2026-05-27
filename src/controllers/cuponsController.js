const sql = require('../config/db');

/**
 * @swagger
 * /api/cupons:
 *   get:
 *     summary: Listar todos os cupons (área administrativa)
 *     tags: [Cupons]
 *     responses:
 *       200:
 *         description: Sucesso
 */
// GET /api/cupons - Listar todos os cupons (área administrativa)
exports.listarTodos = async (req, res) => {
    try {
        const cupons = await sql`
            SELECT * FROM cupons ORDER BY id DESC
        `;
        res.json(cupons);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar cupons.' });
    }
};

/**
 * @swagger
 * /api/cupons/{id}:
 *   get:
 *     summary: Buscar detalhes de um cupom específico
 *     tags: [Cupons]
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
// GET /api/cupons/:id - Buscar detalhes de um cupom específico
exports.buscarPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const cupom = await sql`
            SELECT * FROM cupons WHERE id = ${id}
        `;

        if (cupom.length === 0) {
            return res.status(404).json({ erro: 'Cupom não encontrado.' });
        }
        
        res.json(cupom[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar o cupom.' });
    }
};

/**
 * @swagger
 * /api/cupons:
 *   post:
 *     summary: Criar um novo cupom
 *     tags: [Cupons]
 *     responses:
 *       200:
 *         description: Sucesso
 */
// POST /api/cupons - Criar um novo cupom
exports.criar = async (req, res) => {
    try {
        const { codigo, tipo_desconto, valor, data_validade } = req.body;

        if (!codigo || !tipo_desconto || !valor) {
            return res.status(400).json({ erro: 'Código, tipo de desconto e valor são obrigatórios.' });
        }

        // Garante que o código seja salvo sempre em maiúsculas para evitar confusões
        const codigoFormatado = codigo.toUpperCase().trim();

        // Verifica se o código já existe
        const codigoExiste = await sql`SELECT id FROM cupons WHERE codigo = ${codigoFormatado}`;
        if (codigoExiste.length > 0) {
            return res.status(400).json({ erro: 'Já existe um cupom com este código.' });
        }

        const novoCupom = await sql`
            INSERT INTO cupons (codigo, tipo_desconto, valor, data_validade, ativo)
            VALUES (
                ${codigoFormatado}, 
                ${tipo_desconto}, 
                ${valor}, 
                ${data_validade || null}, 
                true
            )
            RETURNING *
        `;

        res.status(201).json(novoCupom[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao criar o cupom.' });
    }
};

/**
 * @swagger
 * /api/cupons/{id}:
 *   put:
 *     summary: Atualizar um cupom (ex: inativar ou mudar validade)
 *     tags: [Cupons]
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
// PUT /api/cupons/:id - Atualizar um cupom (ex: inativar ou mudar validade)
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { ativo, data_validade } = req.body;

        const cupomExistente = await sql`SELECT id FROM cupons WHERE id = ${id}`;
        if (cupomExistente.length === 0) {
            return res.status(404).json({ erro: 'Cupom não encontrado.' });
        }

        const cupomAtualizado = await sql`
            UPDATE cupons
            SET 
                ativo = COALESCE(${ativo}, ativo),
                data_validade = COALESCE(${data_validade}, data_validade)
            WHERE id = ${id}
            RETURNING *
        `;

        res.json(cupomAtualizado[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar o cupom.' });
    }
};

/**
 * @swagger
 * /api/cupons/validar:
 *   post:
 *     summary: Rota para o cliente aplicar o cupom no carrinho
 *     tags: [Cupons]
 *     responses:
 *       200:
 *         description: Sucesso
 */
// POST /api/cupons/validar - Rota para o cliente aplicar o cupom no carrinho
exports.validarCupom = async (req, res) => {
    try {
        const { codigo } = req.body;

        if (!codigo) {
            return res.status(400).json({ erro: 'Informe o código do cupom.' });
        }

        const codigoFormatado = codigo.toUpperCase().trim();

        const cupom = await sql`
            SELECT * FROM cupons WHERE codigo = ${codigoFormatado}
        `;

        // 1. Verifica se o cupom existe
        if (cupom.length === 0) {
            return res.status(404).json({ erro: 'Cupom inválido ou inexistente.' });
        }

        const dadosCupom = cupom[0];

        // 2. Verifica se está ativo
        if (!dadosCupom.ativo) {
            return res.status(400).json({ erro: 'Este cupom foi desativado.' });
        }

        // 3. Verifica a validade (se houver uma data definida)
        if (dadosCupom.data_validade) {
            const dataAtual = new Date();
            const dataValidade = new Date(dadosCupom.data_validade);

            if (dataAtual > dataValidade) {
                return res.status(400).json({ erro: 'Este cupom já expirou.' });
            }
        }

        // Se passou em todas as validações, retorna os dados para o front-end aplicar o desconto
        res.json({
            mensagem: 'Cupom aplicado com sucesso!',
            id: dadosCupom.id,
            codigo: dadosCupom.codigo,
            tipo_desconto: dadosCupom.tipo_desconto,
            valor: dadosCupom.valor
        });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao validar o cupom.' });
    }
};

/**
 * @swagger
 * /api/cupons/{id}:
 *   delete:
 *     summary: Excluir um cupom
 *     tags: [Cupons]
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
// DELETE /api/cupons/:id - Excluir um cupom
exports.remover = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await sql`
            DELETE FROM cupons WHERE id = ${id}
            RETURNING id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Cupom não encontrado para exclusão.' });
        }

        res.json({ mensagem: 'Cupom removido com sucesso!' });
    } catch (erro) {
        console.error(erro);
        // Pode dar erro se o cupom já estiver vinculado a um pedido fechado
        res.status(500).json({ erro: 'Não é possível excluir este cupom pois ele já foi utilizado em vendas. Experimente inativá-lo através do método PUT.' });
    }
};