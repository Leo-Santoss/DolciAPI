const express = require('express');
const router = express.Router();
const vendasController = require('../controllers/vendasController');

router.get('/', vendasController.listarTodas);
router.get('/:id', vendasController.buscarPorId);
router.post('/', vendasController.criar);
router.put('/:id/status', vendasController.atualizarStatus); // Rota específica para atualizar apenas o status
router.delete('/:id', vendasController.remover);

module.exports = router;