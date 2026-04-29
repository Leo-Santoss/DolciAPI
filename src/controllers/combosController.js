const sql = require('../config/db');

// GET /api/combos - Listar todos os combos com seus respectivos doces
exports.listarTodos = async (req, res) => {
    try {
        // O json_agg agrupa os doces vinculados dentro de um array no próprio select
        const combos = await sql`
            SELECT 
                c.id, c.nome, c.descricao, c.preco, c.ativo,
                COALESCE(
                    json_agg(
                        json_build_object('id', d.id, 'nome', d.nome, 'quantidade', cd.quantidade)
                    ) FILTER (WHERE d.id IS NOT NULL), 
                    '[]'
                ) as doces
            FROM combos c
            LEFT JOIN combo_doces cd ON c.id = cd.combo_id
            LEFT JOIN doces d ON cd.doce_id = d.id
            GROUP BY c.id
            ORDER BY c.id ASC
        `;
        res.json(combos);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar combos no banco de dados.' });
    }
};

// GET /api/combos/:id - Buscar combo específico
exports.buscarPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const combo = await sql`
            SELECT 
                c.id, c.nome, c.descricao, c.preco, c.ativo,
                COALESCE(
                    json_agg(
                        json_build_object('id', d.id, 'nome', d.nome, 'quantidade', cd.quantidade)
                    ) FILTER (WHERE d.id IS NOT NULL), 
                    '[]'
                ) as doces
            FROM combos c
            LEFT JOIN combo_doces cd ON c.id = cd.combo_id
            LEFT JOIN doces d ON cd.doce_id = d.id
            WHERE c.id = ${id}
            GROUP BY c.id
        `;

        if (combo.length === 0) {
            return res.status(404).json({ erro: 'Combo não encontrado.' });
        }
        
        res.json(combo[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar o combo.' });
    }
};

// POST /api/combos - Criar um novo combo
exports.criar = async (req, res) => {
    try {
        const { nome, descricao, preco, docesIds } = req.body;

        if (!nome || !preco || !Array.isArray(docesIds) || docesIds.length === 0) {
            return res.status(400).json({ erro: 'Nome, preço e um array docesIds são obrigatórios.' });
        }

        // Utiliza uma transação (sql.begin) para garantir que ou salva tudo, ou desfaz se der erro
        const comboCriado = await sql.begin(async (t) => {
            // 1. Cria o combo na tabela principal
            const novoCombo = await t`
                INSERT INTO combos (nome, descricao, preco)
                VALUES (${nome}, ${descricao}, ${preco})
                RETURNING *
            `;

            const comboId = novoCombo[0].id;

            // 2. Insere os relacionamentos na tabela combo_doces
            for (const doceId of docesIds) {
                await t`
                    INSERT INTO combo_doces (combo_id, doce_id, quantidade)
                    VALUES (${comboId}, ${doceId}, 1)
                `;
            }

            return novoCombo[0];
        });

        // Adiciona os IDs no retorno só para espelhar o que o usuário enviou
        comboCriado.docesIds = docesIds;
        res.status(201).json(comboCriado);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao criar o combo. Verifique se os IDs dos doces existem.' });
    }
};

// PUT /api/combos/:id - Atualizar um combo
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, ativo, docesIds } = req.body;

        const comboExistente = await sql`SELECT id FROM combos WHERE id = ${id}`;
        if (comboExistente.length === 0) {
            return res.status(404).json({ erro: 'Combo não encontrado.' });
        }

        const comboAtualizado = await sql.begin(async (t) => {
            // 1. Atualiza os dados principais do combo
            const combo = await t`
                UPDATE combos
                SET 
                    nome = COALESCE(${nome}, nome),
                    descricao = COALESCE(${descricao}, descricao),
                    preco = COALESCE(${preco}, preco),
                    ativo = COALESCE(${ativo}, ativo)
                WHERE id = ${id}
                RETURNING *
            `;

            // 2. Se o usuário enviou uma nova lista de docesIds, atualizamos as amarrações
            if (docesIds && Array.isArray(docesIds)) {
                // Deleta as amarrações antigas
                await t`DELETE FROM combo_doces WHERE combo_id = ${id}`;
                
                // Insere as novas
                for (const doceId of docesIds) {
                    await t`
                        INSERT INTO combo_doces (combo_id, doce_id, quantidade)
                        VALUES (${id}, ${doceId}, 1)
                    `;
                }
            }

            return combo[0];
        });

        res.json(comboAtualizado);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar o combo.' });
    }
};

// DELETE /api/combos/:id - Remover um combo
exports.remover = async (req, res) => {
    try {
        const { id } = req.params;

        // Como criamos a tabela combo_doces com ON DELETE CASCADE, 
        // deletar o combo aqui vai limpar a tabela auxiliar automaticamente!
        const resultado = await sql`
            DELETE FROM combos WHERE id = ${id}
            RETURNING id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Combo não encontrado para exclusão.' });
        }

        res.json({ mensagem: 'Combo removido com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover o combo.' });
    }
};