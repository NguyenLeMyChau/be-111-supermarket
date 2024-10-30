// Import necessary modules
const express = require('express');
const promotionController = require('../controllers/promotionController');
const router = express.Router();

// Existing routes
router.get('/get-promotions', promotionController.getPromotions);
router.post('/add-promotion', promotionController.addPromotionHeader);
router.get('/get-promotion-lines', promotionController.getAllPromotionLines);
router.post('/add-promotion-line', promotionController.addPromotionLine);
router.post('/add-promotion-detail', promotionController.addPromotionDetail);
router.put('/update-promotion-header/:id', promotionController.updatePromotionHeader);
router.put('/update-promotion-line/:id', promotionController.updatePromotionLine);
router.put('/update-promotion-detail/:id', promotionController.updatePromotionDetail);
router.delete('/delete-promotion-header/:id', promotionController.deletePromotionHeader);
router.delete('/delete-promotion-line/:id', promotionController.deletePromotionLine);
router.delete('/delete-promotion-detail/:id', promotionController.deletePromotionDetail);

module.exports = router;
