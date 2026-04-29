const express = require('express');
const router = express.Router();
const cuponsController = require('../controllers/cuponsController');

router.get('/', cuponsController.listarTodos);
router.get('/:id', cuponsController.buscarPorId);
router.post('/', cuponsController.criar); // Criar um cupom (Admin)
router.post('/validar', cuponsController.validarCupom); // Validar cupom (Cliente no carrinho)
router.put('/:id', cuponsController.atualizar);
router.delete('/:id', cuponsController.remover);

module.exports = router;