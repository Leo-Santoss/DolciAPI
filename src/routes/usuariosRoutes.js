const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

router.get('/', usuariosController.listarTodos);
router.get('/:id', usuariosController.buscarPorId);
router.post('/', usuariosController.criar);
router.put('/:id', usuariosController.atualizar);
router.delete('/:id', usuariosController.remover);
router.post('/login', usuariosController.login);

module.exports = router;