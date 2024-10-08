const PromotionHeader = require('../models/Promotion_Header');
const PromotionLine = require('../models/Promotion_Line');
const PromotionDetail = require('../models/Promotion_Detail');
const Product = require('../models/Product');
const Unit = require('../models/Unit');

async function getAllPromotion() {
    try {
        const promotionHeaders = await PromotionHeader.find();

        const promotions = await Promise.all(promotionHeaders.map(async (promotionHeader) => {
            const promotionLines = await PromotionLine.find({ promotionHeader_id: promotionHeader._id });

            const promotionDetails = await Promise.all(promotionLines.map(async (promotionLine) => {
                const details = await PromotionDetail.find({ promotionLine_id: promotionLine._id });

                const detailedPromotions = await Promise.all(details.map(async (detail) => {
                    const product = await Product.findById(detail.product_id);
                    const unit = await Unit.findById(detail.unit_id);

                    return {
                        ...detail.toObject(),
                        product: product ? product.toObject() : null,
                        unit: unit ? unit.toObject() : null,
                    };
                }));

                return {
                    ...promotionLine.toObject(),
                    details: detailedPromotions,
                };
            }));

            return {
                ...promotionHeader.toObject(),
                lines: promotionDetails,
            };
        }));

        return promotions;
    } catch (err) {
        throw new Error(`Error getting all promotions: ${err.message}`);
    }
}
const addPromotionHeader = async (promotionData) => {
    try {
        const newPromotion = new PromotionHeader(promotionData);
        return await newPromotion.save();
    } catch (error) {
        throw new Error('Error saving promotion header: ' + error.message);
    }
};;
const getAllPromotionLines = async () => {
    try {
        return await PromotionLine.find({});
    } catch (error) {
        throw new Error('Error fetching promotion lines: ' + error.message);
    }
};

const addPromotionLine = async (promotionLineData) => {
    const promotionHeader = await PromotionHeader.findById(promotionLineData.promotionHeader_id);
    if (!promotionHeader) {
        throw new Error('Promotion Header không tồn tại.');
    }

    const promotionLine = new PromotionLine(promotionLineData);
    return await promotionLine.save();
};

const addPromotionDetail = async (promotionDetailData) => {
  
    const promotionLine = await PromotionLine.findById(promotionDetailData.promotionLine_id);
    if (!promotionLine) {
        throw new Error('Promotion Line không tồn tại.');
    }

    const promotionDetail = new PromotionDetail(promotionDetailData);
    return await promotionDetail.save();
};


module.exports = {
    getAllPromotion,
    addPromotionHeader,
    getAllPromotionLines,
    addPromotionDetail,
    addPromotionLine,
};