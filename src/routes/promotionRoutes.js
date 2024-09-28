const express = require('express');
const promotionController = require('../controllers/promotionController');
const router = express.Router();

router.get('/get-promotions', promotionController.getPromotions);

module.exports = router;