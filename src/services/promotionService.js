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
                    const product_donate = await Product.findById(detail.product_donate);

                    return {
                        ...detail.toObject(),
                        product: product ? product.toObject() : null,
                        product_donate:product_donate?product_donate.toObject():null,
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
const updatePromotionHeader = async (id, promotionData) => {
    try {
        // Tìm PromotionHeader theo ID và cập nhật dữ liệu mới
        const updatedPromotion = await PromotionHeader.findByIdAndUpdate(
            id,
            { $set: promotionData }, // Sử dụng $set để cập nhật chỉ các trường cần thiết
            { new: true, runValidators: true } // new: true để trả về đối tượng đã được cập nhật
        );

        // Nếu không tìm thấy PromotionHeader với ID đó, ném ra lỗi
        if (!updatedPromotion) {
            throw new Error('Promotion Header không tồn tại.');
        }

        return updatedPromotion; // Trả về đối tượng đã được cập nhật
    } catch (error) {
        throw new Error('Cập nhật Promotion Header thất bại: ' + error.message);
    }
};

const updatePromotionLine = async (id, promotionLineData) => {
    try {
        
        const promotionHeader = await PromotionHeader.findById(promotionLineData.promotionHeader_id);
        if (!promotionHeader) {
            throw new Error('Promotion Header không tồn tại.');
        }

        
        const updatedPromotionLine = await PromotionLine.findByIdAndUpdate(
            id,
            { $set: promotionLineData }, // Use $set to update only the specified fields
            { new: true, runValidators: true } // new: true returns the updated document
        );

    
        if (!updatedPromotionLine) {
            throw new Error('Promotion Line không tồn tại.');
        }

        return updatedPromotionLine; // Return the updated promotion line
    } catch (error) {
        throw new Error('Cập nhật Promotion Line thất bại .....: ' + error.message);
    }
};
const updatePromotionDetail = async (id, promotionDetailData) => {
    try {
        // Validate that the promotion line exists
        const promotionLine = await PromotionLine.findById(promotionDetailData.promotionLine_id);
        if (!promotionLine) {
            throw new Error('Promotion Line không tồn tại.');
        }

        // Update the PromotionDetail
        const updatedPromotionDetail = await PromotionDetail.findByIdAndUpdate(
            id,
            { $set: promotionDetailData }, // Use $set to update only the specified fields
            { new: true, runValidators: true } // new: true returns the updated document
        );

        // Check if the PromotionDetail was found and updated
        if (!updatedPromotionDetail) {
            throw new Error('Promotion Detail không tồn tại.');
        }

        return updatedPromotionDetail; // Return the updated promotion detail
    } catch (error) {
        throw new Error('Cập nhật Promotion Detail thất bại: ' + error.message);
    }
};

module.exports = {
    getAllPromotion,
    addPromotionHeader,
    getAllPromotionLines,
    addPromotionDetail,
    addPromotionLine,
    updatePromotionHeader,
    updatePromotionLine, 
    updatePromotionDetail
};

