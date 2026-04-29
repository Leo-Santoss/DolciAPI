const express = require('express');
const router = express.Router();
const estoqueIngredientesController = require('../controllers/estoqueIngredientesController');

router.get('/', estoqueIngredientesController.listarTodos);
router.get('/:id', estoqueIngredientesController.buscarPorId);
router.post('/', estoqueIngredientesController.criar);
router.put('/:id', estoqueIngredientesController.atualizar); // Atualiza os dados (nome, unidade)
router.put('/:id/movimentar', estoqueIngredientesController.movimentar); // Atualiza apenas a quantidade
router.delete('/:id', estoqueIngredientesController.remover);

module.exports = router;