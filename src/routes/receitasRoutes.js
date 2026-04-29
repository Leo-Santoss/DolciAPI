const express = require('express');
const router = express.Router();
const receitasController = require('../controllers/receitasController');

router.get('/', receitasController.listarTodas);
router.get('/doce/:doceId', receitasController.buscarPorDoce); // Rota especial para buscar a receita pelo ID do doce
router.post('/', receitasController.criar);
router.put('/:id', receitasController.atualizar);
router.delete('/:id', receitasController.remover);

module.exports = router;