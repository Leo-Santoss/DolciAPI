const sql = require('../config/db');
const bcrypt = require('bcryptjs'); // Biblioteca para encriptar senhas
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Usuários]
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
// GET /api/usuarios - Listar todos os usuários (sempre omitindo a senha)
exports.listarTodos = async (req, res) => {
    try {
        const usuarios = await sql`
            SELECT id, nome, email, tipo_usuario, criado_em 
            FROM usuarios 
            ORDER BY id ASC
        `;
        res.json(usuarios);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar usuários.' });
    }
};

// GET /api/usuarios/:id - Buscar usuário específico
exports.buscarPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await sql`
            SELECT id, nome, email, tipo_usuario, criado_em 
            FROM usuarios 
            WHERE id = ${id}
        `;

        if (usuario.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }
        
        res.json(usuario[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao buscar o usuário.' });
    }
};

// POST /api/usuarios - Criar um novo usuário (Cadastro)
exports.criar = async (req, res) => {
    try {
        const { nome, email, senha, tipo_usuario } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
        }

        // Verifica se o email já está cadastrado
        const emailExiste = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
        if (emailExiste.length > 0) {
            return res.status(400).json({ erro: 'Este email já está em uso.' });
        }

        // Criptografando a senha (o número 10 é o "salt", nível de complexidade)
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // O tipo de usuário padrão é 'cliente' se não for enviado
        const tipo = tipo_usuario || 'cliente';

        const novoUsuario = await sql`
            INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario)
            VALUES (${nome}, ${email}, ${senhaHash}, ${tipo})
            RETURNING id, nome, email, tipo_usuario, criado_em
        `;

        res.status(201).json(novoUsuario[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao criar o usuário.' });
    }
};

// PUT /api/usuarios/:id - Atualizar dados do usuário
exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, tipo_usuario } = req.body;

        const usuarioExistente = await sql`SELECT id FROM usuarios WHERE id = ${id}`;
        if (usuarioExistente.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        // Atualiza apenas os dados permitidos (não atualizamos a senha nesta rota por segurança)
        const usuarioAtualizado = await sql`
            UPDATE usuarios
            SET 
                nome = COALESCE(${nome}, nome),
                email = COALESCE(${email}, email),
                tipo_usuario = COALESCE(${tipo_usuario}, tipo_usuario)
            WHERE id = ${id}
            RETURNING id, nome, email, tipo_usuario, criado_em
        `;

        res.json(usuarioAtualizado[0]);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao atualizar o usuário.' });
    }
};

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Remove um usuário
 *     tags: [Usuários]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário removido
 *       404:
 *         description: Usuário não encontrado
 */
// DELETE /api/usuarios/:id - Remover um usuário
exports.remover = async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await sql`
            DELETE FROM usuarios WHERE id = ${id}
            RETURNING id
        `;

        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado para exclusão.' });
        }

        res.json({ mensagem: 'Usuário removido com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao remover o usuário.' });
    }
};

/**
 * @swagger
 * /api/usuarios/login:
 *   post:
 *     summary: Faz login do usuário e retorna JWT
 *     tags: [Usuários]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem-sucedido, retorna token
 *       401:
 *         description: Email ou senha inválidos
 */
exports.login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
        }

        const usuarios = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
        if (usuarios.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const usuario = usuarios[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        const payload = {
            userId: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipo_usuario: usuario.tipo_usuario
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret-temporario',
            { expiresIn: '1h' }
        );

        res.status(200).json({
            success: true,
            message: "Usuário logado com sucesso!",
            token: token,
            user: payload
        });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};