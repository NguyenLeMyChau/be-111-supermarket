const promotionService = require("../services/promotionService");

async function getPromotions(req, res) {
    try {
        const promotions = await promotionService.getAllPromotion();
        res.status(200).json(promotions);
    } catch (error) {
        console.error(`Error get products: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
}

const addPromotionHeader = async (req, res) => {
    try {
        const promotionData = req.body;
        const newPromotion = await promotionService.addPromotionHeader(promotionData);
        return res.status(201).json({ message: 'Promotion header added successfully', data: newPromotion });
    } catch (error) {
        console.error('Failed to add promotion header:', error);
        return res.status(500).json({ message: 'Failed to add promotion header', error: error.message });
    }
};
const getAllPromotionLines = async (req, res) => {
    try {
        const promotionLines = await promotionService.getAllPromotionLines();
        return res.status(200).json(promotionLines);
    } catch (error) {
        console.error('Failed to get promotion lines:', error);
        return res.status(500).json({ message: 'Failed to get promotion lines', error: error.message });
    }
};
const addPromotionLine = async (req, res) => {
    try {
        const promotionLineData = req.body;
        const savedPromotionLine = await promotionService.addPromotionLine(promotionLineData);
        res.status(201).json(savedPromotionLine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addPromotionDetail = async (req, res) => {
    try {
        const promotionDetailData = req.body;
        const savedPromotionDetail = await promotionService.addPromotionDetail(promotionDetailData);
        res.status(201).json(savedPromotionDetail);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getPromotions,
    addPromotionHeader,
    getAllPromotionLines,
    addPromotionLine,
    addPromotionDetail
};