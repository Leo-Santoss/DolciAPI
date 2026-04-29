const sql = require('../config/db');

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

// Criar um novo doce (POST /api/doces)
exports.criar = async (req, res) => {
    try {
        const { nome, descricao, preco } = req.body;

        if (!nome || !preco) {
            return res.status(400).json({ erro: 'Nome e preço são obrigatórios.' });
        }

        // O RETURNING * traz o objeto recém-criado, incluindo o ID gerado pelo banco
        const novoDoce = await sql`
            INSERT INTO doces (nome, descricao, preco)
            VALUES (${nome}, ${descricao}, ${preco})
            RETURNING *
        `;

        res.status(201).json(novoDoce[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao salvar o doce no banco.' });
    }
};

// Atualizar um doce existente (PUT /api/doces/:id)
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, ativo } = req.body;

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
                ativo = COALESCE(${ativo}, ativo)
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