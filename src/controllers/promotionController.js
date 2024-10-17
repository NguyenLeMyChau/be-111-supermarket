const promotionService = require("../services/promotionService");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

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
        let promotionDetailData = req.body;

        // Handle product_id: set to null if missing or invalid
        if (!promotionDetailData.product_id || !ObjectId.isValid(promotionDetailData.product_id)) {
            promotionDetailData.product_id = null;
        } else {
            promotionDetailData.product_id = new ObjectId(promotionDetailData.product_id);
        }

        // Handle product_donate: set to null if missing or invalid
        if (!promotionDetailData.product_donate || !ObjectId.isValid(promotionDetailData.product_donate)) {
            promotionDetailData.product_donate = null;
        } else {
            promotionDetailData.product_donate = new ObjectId(promotionDetailData.product_donate);
        }

        // Save the promotion detail with updated product_id and product_donate
        const savedPromotionDetail = await promotionService.addPromotionDetail(promotionDetailData);
        res.status(201).json(savedPromotionDetail);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updatePromotionHeader = async (req, res) => {
    const { id } = req.params; // Lấy ID từ tham số URL
    const promotionData = req.body; // Lấy dữ liệu từ body của yêu cầu

    try {
        const updatedPromotion = await promotionService.updatePromotionHeader(id, promotionData);
        res.status(200).json({ message: 'Promotion header updated successfully', data: updatedPromotion });
    } catch (error) {
        console.error('Failed to update promotion header:', error);
        res.status(400).json({ message: error.message });
    }
};
const updatePromotionLine = async (req, res) => {
    const { id } = req.params; 
    const promotionLineData = req.body; 

    try {
     
        const updatedPromotionLine = await promotionService.updatePromotionLine(id, promotionLineData);

        res.status(200).json(updatedPromotionLine);
    } catch (error) {
        res.status(500).json({ error: 'Cập nhật Promotion Line thất bại: ' + error.message });
    }
};

const updatePromotionDetail = async (req, res) => {
    const { id } = req.params;
    const promotionDetailData = req.body; 

    try {
        if (!promotionDetailData.product_id || !ObjectId.isValid(promotionDetailData.product_id)) {
            promotionDetailData.product_id = null;
        } else {
            promotionDetailData.product_id = new ObjectId(promotionDetailData.product_id);
        }

        // Handle product_donate: set to null if missing or invalid
        if (!promotionDetailData.product_donate || !ObjectId.isValid(promotionDetailData.product_donate)) {
            promotionDetailData.product_donate = null;
        } else {
            promotionDetailData.product_donate = new ObjectId(promotionDetailData.product_donate);
        }
        const updatedPromotionDetail = await promotionService.updatePromotionDetail(id, promotionDetailData);

        if (!updatedPromotionDetail) {
            return res.status(404).json({ error: 'Promotion Detail không tồn tại.' });
        }

        res.status(200).json(updatedPromotionDetail);
    } catch (error) {
        res.status(500).json({ error: 'Cập nhật Promotion Detail thất bại: ' + error.message });
    }
};
const getPromotionsByProductIdsController = async (req, res) => {
    try {
      // Lấy danh sách productIds từ body của request
      const { product_id } = req.body;
      
  
      // Gọi service để lấy thông tin khuyến mãi
      const promotions = await promotionService.getPromotionByProductId(product_id);
  
      // Trả về danh sách khuyến mãi
      return res.status(200).json(promotions);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin khuyến mãi:', error);
      // Trả về lỗi 500 nếu có lỗi từ server
      return res.status(500).json({ message: 'Có lỗi xảy ra khi lấy thông tin khuyến mãi.' });
    }
  };
module.exports = {
    getPromotions,
    addPromotionHeader,
    getAllPromotionLines,
    addPromotionLine,
    addPromotionDetail,
    updatePromotionHeader,
    updatePromotionLine,
    updatePromotionDetail,
    getPromotionsByProductIdsController
};