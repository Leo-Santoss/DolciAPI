const express = require('express');
const router = express.Router();
const entregasController = require('../controllers/entregasController');

router.get('/', entregasController.listarTodas);
router.get('/pedido/:pedidoId', entregasController.buscarPorPedido); // Busca pelo ID da venda
router.post('/', entregasController.criar);
router.put('/:id/status', entregasController.atualizarStatus); // Atualiza onde o motoboy/correio está
router.delete('/:id', entregasController.remover);

module.exports = router;