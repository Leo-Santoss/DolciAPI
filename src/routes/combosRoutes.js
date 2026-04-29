const express = require('express');
const router = express.Router();
const combosController = require('../controllers/combosController');

router.get('/', combosController.listarTodos);
router.get('/:id', combosController.buscarPorId);
router.post('/', combosController.criar);
router.put('/:id', combosController.atualizar);
router.delete('/:id', combosController.remover);

module.exports = router;