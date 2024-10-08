const express = require('express');
const promotionController = require('../controllers/promotionController');
const router = express.Router();

router.get('/get-promotions', promotionController.getPromotions);
router.post('/add-promotion', promotionController.addPromotionHeader);
router.get('/get-promotion-lines', promotionController.getAllPromotionLines);
router.post('/add-promotion-line', promotionController.addPromotionLine);
router.post('/add-promotion-detail', promotionController.addPromotionDetail);

module.exports = router;