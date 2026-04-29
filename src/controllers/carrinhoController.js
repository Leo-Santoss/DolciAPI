const sql = require('../config/db');

// GET /api/carrinhos/usuario/:usuarioId - Buscar o carrinho do usuário com todos os itens
exports.buscarPorUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        // Busca o ID do carrinho ativo
        const carrinho = await sql`SELECT id FROM carrinhos WHERE usuario_id = ${usuarioId}`;

        if (carrinho.length === 0) {
            // Retorna um carrinho vazio amigável em vez de erro
            return res.json({ id: null, usuario_id: usuarioId, itens: [], valor_total: 0 });
        }

        const carrinhoId = carrinho[0].id;

        // Busca os itens mesclando dados dos doces e dos combos para calcular o subtotal
        const itens = await sql`
            SELECT 
                ci.id AS item_carrinho_id,
                ci.doce_id, d.nome AS nome_doce, d.preco AS preco_doce,
                ci.combo_id, c.nome AS nome_combo, c.preco AS preco_combo,
                ci.quantidade,
                -- Calcula o preço unitário dependendo se é doce ou combo
                COALESCE(d.preco, c.preco) AS preco_unitario,
                -- Calcula o subtotal daquele item
                (ci.quantidade * COALESCE(d.preco, c.preco)) AS subtotal
            FROM carrinho_itens ci
            LEFT JOIN doces d ON ci.doce_id = d.id
            LEFT JOIN combos c ON ci.combo_id = c.id
            WHERE ci.carrinho_id = ${carrinhoId}
            ORDER BY ci.id ASC
        `;

        // Calcula o valor total do carrinho somando os subtotais
        const valorTotal = itens.reduce((acc, item) => acc + Number(item.subtotal), 0);

        res.json({
            id: carrinhoId,
            usuario_id: usuarioId,
            itens: itens,
            valor_total: valorTotal.toFixed(2)
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar o carrinho.' });
    }
};

// POST /api/carrinhos/usuario/:usuarioId/itens - Adicionar um item ao carrinho
exports.adicionarItem = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { doce_id, combo_id, quantidade } = req.body;

        // Validação da regra do banco: ou tem doce_id, ou tem combo_id, mas não ambos
        if ((!doce_id && !combo_id) || (doce_id && combo_id)) {
            return res.status(400).json({ erro: 'Informe APENAS um doce_id OU um combo_id.' });
        }

        const qtd = quantidade || 1;

        await sql.begin(async (t) => {
            // 1. Verifica se o usuário já tem um carrinho. Se não, cria um.
            let carrinho = await t`SELECT id FROM carrinhos WHERE usuario_id = ${usuarioId}`;
            let carrinhoId;

            if (carrinho.length === 0) {
                const novoCarrinho = await t`
                    INSERT INTO carrinhos (usuario_id) VALUES (${usuarioId}) RETURNING id
                `;
                carrinhoId = novoCarrinho[0].id;
            } else {
                carrinhoId = carrinho[0].id;
            }

            // 2. Verifica se este exato produto já está no carrinho
            const itemExistente = await t`
                SELECT id, quantidade FROM carrinho_itens 
                WHERE carrinho_id = ${carrinhoId} 
                AND (doce_id = ${doce_id || null} OR combo_id = ${combo_id || null})
            `;

            if (itemExistente.length > 0) {
                // Se já existe, apenas soma a quantidade
                await t`
                    UPDATE carrinho_itens 
                    SET quantidade = quantidade + ${qtd} 
                    WHERE id = ${itemExistente[0].id}
                `;
            } else {
                // Se não existe, insere a nova linha
                await t`
                    INSERT INTO carrinho_itens (carrinho_id, doce_id, combo_id, quantidade)
                    VALUES (${carrinhoId}, ${doce_id || null}, ${combo_id || null}, ${qtd})
                `;
            }
        });

        res.status(201).json({ mensagem: 'Item adicionado ao carrinho com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao adicionar item ao carrinho.' });
    }
};

// PUT /api/carrinhos/itens/:itemId - Atualizar a quantidade de um item (ex: + ou - no botão do front)
exports.atualizarQuantidade = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantidade } = req.body;

        if (quantidade === undefined || quantidade < 1) {
            return res.status(400).json({ erro: 'A quantidade deve ser maior ou igual a 1.' });
        }

        const itemAtualizado = await sql`
            UPDATE carrinho_itens
            SET quantidade = ${quantidade}
            WHERE id = ${itemId}
            RETURNING *
        `;

        if (itemAtualizado.length === 0) {
            return res.status(404).json({ erro: 'Item não encontrado no carrinho.' });
        }

        res.json({ mensagem: 'Quantidade atualizada!', item: itemAtualizado[0] });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar quantidade.' });
    }
};

// DELETE /api/carrinhos/itens/:itemId - Remover um item específico do carrinho
exports.removerItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const resultado = await sql`
            DELETE FROM carrinho_itens WHERE id = ${itemId}
            RETURNING id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Item não encontrado para exclusão.' });
        }

        res.json({ mensagem: 'Item removido do carrinho.' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover o item.' });
    }
};

// DELETE /api/carrinhos/usuario/:usuarioId - Esvaziar o carrinho inteiro
exports.esvaziarCarrinho = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        // Como a tabela carrinho_itens tem ON DELETE CASCADE, 
        // deletar o carrinho apaga todos os itens dele automaticamente.
        const resultado = await sql`
            DELETE FROM carrinhos WHERE usuario_id = ${usuarioId}
            RETURNING id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Nenhum carrinho ativo encontrado para este usuário.' });
        }

        res.json({ mensagem: 'Carrinho esvaziado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao esvaziar o carrinho.' });
    }
};