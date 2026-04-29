const express = require('express');
const router = express.Router();

// Importa o Controller com a lógica
const docesController = require('../controllers/docesController');

// Mapeamento das rotas para os métodos do Controller
router.get('/', docesController.listarTodos);
router.get('/:id', docesController.buscarPorId);
router.post('/', docesController.criar);
router.put('/:id', docesController.atualizar);
router.delete('/:id', docesController.remover);

module.exports = router;