const express = require('express');
const firmController = require('../controllers/firmController');

const router = express.Router();

router
    .route('/')
    .get(firmController.getAllFirms)
    .post(firmController.createFirm);

router
    .route('/:id')
    .get(firmController.getFirm)
    .patch(firmController.updateFirm)
    .delete(firmController.deleteFirm);

module.exports = router;