const express = require('express');
const router = express.Router();
const estoqueDocesController = require('../controllers/estoqueDocesController');

router.get('/', estoqueDocesController.listarTodos);
router.get('/:doceId', estoqueDocesController.buscarPorDoce);
router.post('/', estoqueDocesController.definirEstoque); // Inicializa ou sobrepõe a quantidade
router.put('/:doceId/movimentar', estoqueDocesController.movimentar); // Soma ou subtrai
router.delete('/:doceId', estoqueDocesController.remover);

module.exports = router;