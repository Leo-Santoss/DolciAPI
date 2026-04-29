const sql = require('../config/db');

// GET /api/entregas - Listar todas as entregas (trazendo dados do pedido e cliente)
exports.listarTodas = async (req, res) => {
    try {
        const entregas = await sql`
            SELECT 
                e.id, e.pedido_id, e.status_entrega, e.codigo_rastreio, e.cep, e.endereco_completo, e.atualizado_em,
                u.nome AS nome_cliente, u.email
            FROM entregas e
            JOIN pedidos p ON e.pedido_id = p.id
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY e.id DESC
        `;
        res.json(entregas);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar as entregas.' });
    }
};

// GET /api/entregas/pedido/:pedidoId - Buscar a entrega de um pedido específico
exports.buscarPorPedido = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const entrega = await sql`
            SELECT * FROM entregas WHERE pedido_id = ${pedidoId}
        `;

        if (entrega.length === 0) {
            return res.status(404).json({ erro: 'Nenhuma entrega encontrada para este pedido.' });
        }
        
        res.json(entrega[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar a entrega.' });
    }
};

// POST /api/entregas - Registrar uma nova entrega para um pedido
exports.criar = async (req, res) => {
    try {
        const { pedido_id, endereco_completo, cep, codigo_rastreio } = req.body;

        if (!pedido_id || !endereco_completo || !cep) {
            return res.status(400).json({ erro: 'ID do pedido, endereço e CEP são obrigatórios.' });
        }

        // 1. Verifica se o pedido existe
        const pedidoExiste = await sql`SELECT id FROM pedidos WHERE id = ${pedido_id}`;
        if (pedidoExiste.length === 0) {
            return res.status(404).json({ erro: 'Pedido não encontrado.' });
        }

        // 2. Verifica se já existe uma entrega para este pedido (Relação 1:1)
        const entregaExiste = await sql`SELECT id FROM entregas WHERE pedido_id = ${pedido_id}`;
        if (entregaExiste.length > 0) {
            return res.status(400).json({ erro: 'Este pedido já possui uma entrega registrada. Use PUT para atualizá-la.' });
        }

        const novaEntrega = await sql`
            INSERT INTO entregas (pedido_id, endereco_completo, cep, status_entrega, codigo_rastreio)
            VALUES (${pedido_id}, ${endereco_completo}, ${cep}, 'pendente', ${codigo_rastreio || null})
            RETURNING *
        `;

        res.status(201).json(novaEntrega[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao registrar a entrega.' });
    }
};

// PUT /api/entregas/:id/status - Atualizar o status e rastreio da entrega
exports.atualizarStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_entrega, codigo_rastreio } = req.body;

        const entregaExistente = await sql`SELECT id FROM entregas WHERE id = ${id}`;
        if (entregaExistente.length === 0) {
            return res.status(404).json({ erro: 'Entrega não encontrada.' });
        }

        const entregaAtualizada = await sql`
            UPDATE entregas
            SET 
                status_entrega = COALESCE(${status_entrega}, status_entrega),
                codigo_rastreio = COALESCE(${codigo_rastreio}, codigo_rastreio),
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;

        res.json(entregaAtualizada[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar a entrega.' });
    }
};

// DELETE /api/entregas/:id - Cancelar/Remover uma entrega
exports.remover = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await sql`
            DELETE FROM entregas WHERE id = ${id}
            RETURNING id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Entrega não encontrada para exclusão.' });
        }

        res.json({ mensagem: 'Registro de entrega removido com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover a entrega.' });
    }
};