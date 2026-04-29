const express = require('express');
const router = express.Router();
const carrinhoController = require('../controllers/carrinhoController');

// Rotas focadas no carrinho do usuário
router.get('/usuario/:usuarioId', carrinhoController.buscarPorUsuario);
router.post('/usuario/:usuarioId/itens', carrinhoController.adicionarItem);
router.delete('/usuario/:usuarioId', carrinhoController.esvaziarCarrinho);

// Rotas focadas diretamente no ID do item que está dentro do carrinho
router.put('/itens/:itemId', carrinhoController.atualizarQuantidade);
router.delete('/itens/:itemId', carrinhoController.removerItem);

module.exports = router;