const sql = require('../config/db');

// GET /api/vendas - Listar todas as vendas (com dados do usuário)
exports.listarTodas = async (req, res) => {
    try {
        const vendas = await sql`
            SELECT 
                p.id, p.usuario_id, u.nome AS nome_cliente, 
                p.cupom_id, p.valor_total, p.status, p.criado_em
            FROM pedidos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.criado_em DESC
        `;
        res.json(vendas);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar vendas.' });
    }
};

// GET /api/vendas/:id - Buscar detalhes de uma venda específica (com seus itens)
exports.buscarPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Busca os dados gerais do pedido
        const pedido = await sql`
            SELECT p.*, u.nome AS nome_cliente
            FROM pedidos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = ${id}
        `;

        if (pedido.length === 0) {
            return res.status(404).json({ erro: 'Venda não encontrada.' });
        }

        // Busca os itens comprados neste pedido
        const itens = await sql`
            SELECT 
                pi.id, pi.doce_id, d.nome AS nome_doce,
                pi.combo_id, c.nome AS nome_combo,
                pi.quantidade, pi.preco_unitario,
                (pi.quantidade * pi.preco_unitario) AS subtotal
            FROM pedido_itens pi
            LEFT JOIN doces d ON pi.doce_id = d.id
            LEFT JOIN combos c ON pi.combo_id = c.id
            WHERE pi.pedido_id = ${id}
        `;

        // Monta o objeto final de resposta juntando o pedido e os itens
        const resposta = {
            ...pedido[0],
            itens: itens
        };
        
        res.json(resposta);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar os detalhes da venda.' });
    }
};

// POST /api/vendas - Criar uma nova venda (Checkout)
exports.criar = async (req, res) => {
    try {
        const { usuario_id, cupom_id, valor_total, itens } = req.body;

        // Validação básica
        if (!usuario_id || !valor_total || !Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ erro: 'ID do usuário, valor total e a lista de itens são obrigatórios.' });
        }

        // Usando transação para garantir que o pedido e os itens sejam salvos juntos
        const novaVenda = await sql.begin(async (t) => {
            // 1. Insere o pedido na tabela principal
            const pedido = await t`
                INSERT INTO pedidos (usuario_id, cupom_id, valor_total, status)
                VALUES (${usuario_id}, ${cupom_id || null}, ${valor_total}, 'aguardando_pagamento')
                RETURNING *
            `;

            const pedidoId = pedido[0].id;

            // 2. Insere os itens do pedido
            for (const item of itens) {
                // item deve ter: doce_id (ou combo_id), quantidade e preco_unitario
                await t`
                    INSERT INTO pedido_itens (pedido_id, doce_id, combo_id, quantidade, preco_unitario)
                    VALUES (
                        ${pedidoId}, 
                        ${item.doce_id || null}, 
                        ${item.combo_id || null}, 
                        ${item.quantidade}, 
                        ${item.preco_unitario}
                    )
                `;
            }

            return pedido[0];
        });

        res.status(201).json({
            mensagem: 'Venda registrada com sucesso!',
            pedido: novaVenda
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao registrar a venda. Verifique os dados enviados.' });
    }
};

// PUT /api/vendas/:id/status - Atualizar o status de uma venda (Preparando, Enviado, etc)
exports.atualizarStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ erro: 'O novo status é obrigatório.' });
        }

        const pedidoAtualizado = await sql`
            UPDATE pedidos
            SET status = ${status}
            WHERE id = ${id}
            RETURNING *
        `;

        if (pedidoAtualizado.length === 0) {
            return res.status(404).json({ erro: 'Venda não encontrada.' });
        }

        res.json(pedidoAtualizado[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar o status da venda.' });
    }
};

// DELETE /api/vendas/:id - Cancelar/Remover uma venda
exports.remover = async (req, res) => {
    try {
        const { id } = req.params;

        // O banco apagará automaticamente os registros na tabela pedido_itens
        // graças ao "ON DELETE CASCADE" que configuramos no script SQL
        const resultado = await sql`
            DELETE FROM pedidos WHERE id = ${id}
            RETURNING id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Venda não encontrada para exclusão.' });
        }

        res.json({ mensagem: 'Venda cancelada e removida com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover a venda.' });
    }
};