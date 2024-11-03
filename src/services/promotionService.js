const PromotionHeader = require('../models/Promotion_Header');
const PromotionLine = require('../models/Promotion_Line');
const PromotionDetail = require('../models/Promotion_Detail');
const Product = require('../models/Product');
const Unit = require('../models/Unit');

async function getActivePromotionLinesForToday() {
    try {
      const today = new Date();
      
      // Query for active promotions where today's date is between startDate and endDate
      const activePromotions = await PromotionLine.find({
        status: 'active',
        startDate: { $lte: today },
        endDate: { $gte: today },
      });
  
      return activePromotions;
    } catch (err) {
      throw new Error(`Error finding active promotions: ${err.message}`);
    }
  }

  
async function getAllPromotion() {
    try {
        const promotionHeaders = await PromotionHeader.find();

        const promotions = await Promise.all(promotionHeaders.map(async (promotionHeader) => {
            const promotionLines = await PromotionLine.find({ promotionHeader_id: promotionHeader._id });

            const promotionDetails = await Promise.all(promotionLines.map(async (promotionLine) => {
                const details = await PromotionDetail.find({ promotionLine_id: promotionLine._id }).populate('unit_id')
                .populate('unit_id_donate');
                const detailedPromotions = await Promise.all(details.map(async (detail) => {
                    const product = await Product.findById(detail.product_id).populate('unit_id');
                    const product_donate = await Product.findById(detail.product_donate).populate('unit_id');

                    // // Find the product using item_code and unit_id
                    // const product = await Product.findOne({
                    //     item_code: detail.item_code,
                    //     "unit_convert.unit": detail.unit_id
                    // }).populate('unit_id'); // Populate if you want unit details

                    // // Find the donated product using item_code_donate and unit_id_donate
                    // const product_donate = await Product.findOne({
                    //     item_code: detail.item_code_donate,
                    //     "unit_convert.unit": detail.unit_id_donate
                    // }).populate('unit_id'); // Populate if you want unit details

                    return {
                        ...detail.toObject(),
                        product: product ? product.toObject() : null,
                        product_donate: product_donate ? product_donate.toObject() : null,
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
         await newPromotion.save();
         const allPromotion = await getAllPromotion();
         return allPromotion;
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
        throw new Error('Không tìm thấy chương trình khuyến mãi');
    }
    
    const promotionLine = new PromotionLine(promotionLineData);
    await promotionLine.save();

    const allPromotion = await getAllPromotion();
    return allPromotion;
};

const addPromotionDetail = async (promotionDetailData) => {
  
    const promotionLine = await PromotionLine.findById(promotionDetailData.promotionLine_id);
    if (!promotionLine) {
        throw new Error('Promotion Line không tồn tại.');
    }

    const promotionDetail = new PromotionDetail(promotionDetailData);
    await promotionDetail.save();

    const allPromotion = await getAllPromotion();
    return allPromotion;
};
const updatePromotionHeader = async (id, promotionData) => {
    try {
        // Find and update the PromotionHeader
        const updatedPromotion = await PromotionHeader.findByIdAndUpdate(
            id,
            { $set: promotionData },
            { new: true, runValidators: true }
        );

        if (!updatedPromotion) {
            throw new Error('Chương trình khuyến mãi không tồn tại.');
        }

        // Get the new end date from the promotionData
        const newEndDate = new Date(promotionData.endDate).getTime();

        // Find all promotion lines associated with this header
        const promotionLines = await PromotionLine.find({ promotionHeader_id: id });

        // Loop through each line to check and update dates as needed
        for (const line of promotionLines) {
            const lineEndDate = new Date(line.endDate).getTime();
            const lineStartDate = new Date(line.startDate).getTime();

            // Update end date if it exceeds the PromotionHeader's new end date
            if (lineEndDate > newEndDate) {
                line.endDate = new Date(newEndDate);
            }
            // Update start date if it is after the PromotionHeader's new end date
            if (lineStartDate > newEndDate) {
                line.startDate = new Date(newEndDate);
            }

            // Save the updated promotion line
            await line.save();
        }

        // Fetch all promotions after the update for return
        const allPromotions = await getAllPromotion();
        return allPromotions;

    } catch (error) {
        throw new Error(`Cập nhật chương trình khuyến mãi thất bại: ${error.message}`);
    }
};


const updatePromotionLine = async (id, promotionLineData) => {
    const messages = [];
    try { 
        const promotionHeader = await PromotionHeader.findById(promotionLineData.promotionHeader_id);
        if (!promotionHeader) {
            messages.push('Chương trình khuyến mãi không tồn tại.')
        }
        const updatedPromotionLine = await PromotionLine.findByIdAndUpdate(
            id,
            { $set: promotionLineData }, // Use $set to update only the specified fields
            { new: true, runValidators: true } // new: true returns the updated document
        );

    
        if (!updatedPromotionLine) {
            messages.push('dòng khuyến mãi tìm thấy');
        }else  messages.push('Cập nhật dòng khuyến mãi thành công')

        const allPromotion = await getAllPromotion();
        return { message:messages,data: allPromotion};
    } catch (error) {
        messages.push('Cập nhật thất bại');
        return { message:messages,data: await getAllPromotion()};
    }
};
const updatePromotionDetail = async (id, promotionDetailData) => {
    const messages = [];
    try {
        // Validate that the promotion line exists
        const promotionLine = await PromotionLine.findById(promotionDetailData.promotionLine_id);
        if (!promotionLine) {
            messages.push('Dòng khuyến mãi không tồn tại.');
        }

        // Update the PromotionDetail
        const updatedPromotionDetail = await PromotionDetail.findByIdAndUpdate(
            id,
            { $set: promotionDetailData }, // Use $set to update only the specified fields
            { new: true, runValidators: true } // new: true returns the updated document
        );

        // Check if the PromotionDetail was found and updated
        if (!updatedPromotionDetail) {
            messages.push('Chi tiết khuyến mãi không tồn tại');
        }else  messages.push('Cập nhật chi tiết khuyến mãi thành công')

        const allPromotion = await getAllPromotion();
        return { message:messages,data: allPromotion};

    } catch (error) {
        messages.push('Cập nhật chi tiết khuyến mãi thất bại: ');
    }
};

const getPromotionByProductId = async (productId) => {
    try {
      // Tìm chi tiết khuyến mãi cho product_id hoặc product_donate đã cho, với điều kiện promotionLine và promotionHeader isActive === true
      const promotions = await PromotionDetail.find({
        $or: [{ product_id: productId }, { product_donate: productId }] // Tìm các khuyến mãi có product_id hoặc product_donate bằng với productId
      })
        .populate({
          path: 'promotionLine_id',
          match: { isActive: true }, // Điều kiện isActive === true cho promotionLine
          select: 'description startDate endDate isActive type',
          populate: {
            path: 'promotionHeader_id',
            match: { isActive: true }, // Điều kiện isActive === true cho promotionHeader
            select: 'description startDate endDate isActive',
          },
        })
        .exec();
  
      // Lọc ra các khuyến mãi hợp lệ, nơi promotionLine và promotionHeader không bị null (đảm bảo isActive === true)
      const validPromotions = promotions.filter(
        (promotion) =>
          promotion.promotionLine_id && promotion.promotionLine_id.promotionHeader_id
      );
  
      // Trả về các khuyến mãi hợp lệ
      return validPromotions;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin khuyến mãi theo Product ID:', error);
      throw error;
    }
  };
  
  
  const getPromotionByVoucher = async (voucher) => {
    try {
        // Tìm chi tiết khuyến mãi theo mã voucher, với điều kiện PromotionLine và PromotionHeader isActive === true
        const promotions = await PromotionDetail.find({ voucher: voucher }) // Tìm các khuyến mãi có mã voucher khớp
            .populate({
                path: 'promotionLine_id',
                match: { isActive: true }, // Điều kiện isActive === true cho PromotionLine
                select: 'description startDate endDate isActive type',
                populate: {
                    path: 'promotionHeader_id',
                    match: { isActive: true }, // Điều kiện isActive === true cho PromotionHeader
                    select: 'description startDate endDate isActive',
                },
            })
            .exec();

        // Lọc ra các khuyến mãi hợp lệ, nơi PromotionLine và PromotionHeader không bị null (đảm bảo isActive === true)
        const validPromotions = promotions.filter(promotion =>
            promotion.promotionLine_id && promotion.promotionLine_id.promotionHeader_id
        );

        // Trả về các khuyến mãi hợp lệ
        return validPromotions;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin khuyến mãi theo voucher:', error);
        throw error;
    }
}; 
async function getAllPromotionACtive() {
    try {
        // Tìm chi tiết khuyến mãi cho product_id đã cho, với điều kiện promotionLine và promotionHeader isActive === true
        const promotions = await PromotionDetail.find() // Tìm các khuyến mãi có product_id bằng với productId
          .populate({
            path: 'promotionLine_id',
            match: { isActive: true }, // Điều kiện isActive === true cho promotionLine
            select: 'description startDate endDate isActive type',
            populate: {
              path: 'promotionHeader_id',
              match: { isActive: true }, // Điều kiện isActive === true cho promotionHeader
              select: 'description startDate endDate isActive',
            },
          })
          .exec();
    
        // Lọc ra các khuyến mãi hợp lệ, nơi promotionLine và promotionHeader không bị null (đảm bảo isActive === true)
        const validPromotions = promotions.filter(promotion =>
          promotion.promotionLine_id && promotion.promotionLine_id.promotionHeader_id
        );
    
        // Trả về các khuyến mãi hợp lệ
        return validPromotions;
      } catch (error) {
        console.error('Lỗi khi lấy thông tin khuyến mãi theo Product ID:', error);
        throw error;
      }
    };
    const deletePromotionHeader = async (promotionHeaderId) => {
        const messages = [];
        try {
            // Step 1: Find all PromotionLine documents associated with the PromotionHeader
            const promotionLines = await PromotionLine.find({ promotionHeader_id: promotionHeaderId });
    
            // Step 2: Get the IDs of all associated PromotionLine documents
            const promotionLineIds = promotionLines.map(line => line._id);
    
            // Step 3: Delete all PromotionDetail documents that reference any of these PromotionLine IDs
            await PromotionDetail.deleteMany({ promotionLine_id: { $in: promotionLineIds } });
    
            // Step 4: Delete all PromotionLine documents associated with the PromotionHeader
            await PromotionLine.deleteMany({ promotionHeader_id: promotionHeaderId });
    
            // Step 5: Delete the PromotionHeader itself
            const result = await PromotionHeader.findByIdAndDelete(promotionHeaderId);
            if (!result) {
                messages.push('Không tìm thấy chương trình khuyến mãi') 
            }else{
               
                messages.push('Xóa chương trình khuyến mãi thành công')
              
            }
            const allPromotion = await getAllPromotion();
            return { message:messages,data: allPromotion};
        } catch (error) {
            const allPromotion = await getAllPromotion();
            messages.push('Lỗi xóa chương trình khuyến mãi') 
            return { message:messages, data: allPromotion};
        }
    };
    const deletePromotionLine = async (promotionLineId) => {
        const messages = [];
        try {
           
            const detailsDeleted = await PromotionDetail.deleteMany({ promotionLine_id: promotionLineId });
    
            // Bước 2: Xóa PromotionLine
            const result = await PromotionLine.findByIdAndDelete(promotionLineId);
            if (!result) {
                messages.push('Không tìm thấy dòng khuyến mãi');
            } else {
                messages.push('Đã xóa dòng khuyến mãi thành công');
            }
    
            // Tùy chọn: Bạn có thể lấy danh sách các dòng khuyến mãi hiện tại
            const allPromotion = await getAllPromotion();
            return {
                message:messages,
                data: allPromotion,
            };
        } catch (error) {
            messages.push('Lỗi khi xóa dòng khuyến mãi và chi tiết: ');
            return {
                message:messages,
                data:  await getAllPromotion() 
            };
        }
    };
    
    const deletePromotionDetail = async (id) => {
        const messages = [];
        try {
            const result = await PromotionDetail.findByIdAndDelete(id);
            if (!result) {
                messages.push('Không tìm thấy chi tiết khuyến mãi');
            } else {
                messages.push('Đã xóa chi tiết khuyến mãi thành công');
            }
    
            const allPromotion = await getAllPromotion();
            return {
                message:messages,
                data: allPromotion,
            };
        } catch (error) {
            messages.push('Lỗi khi xóa chi tiết khuyến mãi: ' + error.message);
            return {
                message:messages,
                data:  await getAllPromotion() 
            };
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
    updatePromotionDetail,
    getPromotionByProductId,
    getPromotionByVoucher,
    getAllPromotionACtive,
    deletePromotionHeader,
    deletePromotionLine,
    deletePromotionDetail
};

