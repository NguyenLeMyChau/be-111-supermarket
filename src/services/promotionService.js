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
        const promotionHeaders = await PromotionHeader.find({isActive: true});

        const promotions = await Promise.all(promotionHeaders.map(async (promotionHeader) => {
            const promotionLines = await PromotionLine.find({ promotionHeader_id: promotionHeader._id ,isActive: true});

            const promotionDetails = await Promise.all(promotionLines.map(async (promotionLine) => {
                const details = await PromotionDetail.find({ promotionLine_id: promotionLine._id,isActive: true }).populate('unit_id')
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

const getPromotionByProductId = async (productId, unit_id) => {
    try {
      const today = new Date();
  
      // Tìm chi tiết khuyến mãi cho product_id hoặc product_donate với unit_id
      const promotions = await PromotionDetail.find({

        $or: [
          { product_id: productId, unit_id: unit_id ,isActive:true},
          { product_donate: productId, unit_id_donate: unit_id,isActive:true }
        ]
      }).populate('unit_id')
      .populate('unit_id_donate')
        .populate({
          path: 'promotionLine_id',
          match: {
            status: 'active',
            startDate: { $lte: today }, // Ngày bắt đầu phải nhỏ hơn hoặc bằng hôm nay
            endDate: { $gte: today }     // Ngày kết thúc phải lớn hơn hoặc bằng hôm nay
          },
          populate: {
            path: 'promotionHeader_id',
            match: { isActive: true } // Chỉ lấy các PromotionHeader đang hoạt động
          }
          
        });
  
      // Lọc ra các khuyến mãi hợp lệ
      const validPromotions = promotions.filter(
        (promotion) =>
          promotion.promotionLine_id && promotion.promotionLine_id.promotionHeader_id
      );
  
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
async function getAllPromotionActive() {
    try {
        const currentDate = new Date();

        // Find promotion details with active promotionLine, promotionHeader, and promotionDetail
        const promotions = await PromotionDetail.find({ isActive: true })  // Filter PromotionDetail by isActive
            .populate({
                path: 'promotionLine_id',
                match: {
                    isActive: true, // Ensure promotionLine is active
                    status: 'active', // Ensure promotionLine status is active
                    startDate: { $lte: currentDate }, // promotionLine start date should be on or before current date
                    endDate: { $gte: currentDate } // promotionLine end date should be on or after current date
                },
                select: 'description startDate endDate isActive type',
                populate: {
                    path: 'promotionHeader_id',
                    match: {
                        isActive: true, // Ensure promotionHeader is active
                        startDate: { $lte: currentDate }, // promotionHeader start date should be on or before current date
                        endDate: { $gte: currentDate } // promotionHeader end date should be on or after current date
                    },
                    select: 'description startDate endDate isActive'
                }
            })
            .exec();

        // Filter promotions where all related documents are valid and active
        const validPromotions = promotions.filter(promotion =>
            promotion.promotionLine_id && 
            promotion.promotionLine_id.promotionHeader_id &&
            promotion.isActive // Ensure the promotion detail is active
        );

        return validPromotions;
    } catch (error) {
        console.error('Error retrieving active promotions:', error);
        throw error;
    }
}


  
  const deletePromotionHeader = async (promotionHeaderId) => {
    const messages = [];
    try {
        // Step 1: Find all PromotionLine documents associated with the PromotionHeader
        const promotionLines = await PromotionLine.find({ promotionHeader_id: promotionHeaderId });

        // Step 2: Get the IDs of all associated PromotionLine documents
        const promotionLineIds = promotionLines.map(line => line._id);

        // Step 3: Update all PromotionDetail documents that reference any of these PromotionLine IDs
        const detailsUpdated = await PromotionDetail.updateMany(
            { promotionLine_id: { $in: promotionLineIds } },
            { $set: { isActive: false } } // Set isActive to false
        );

        // Step 4: Update all PromotionLine documents associated with the PromotionHeader
        const linesUpdated = await PromotionLine.updateMany(
            { promotionHeader_id: promotionHeaderId },
            { $set: { status: 'inactive' ,isActive: false} } // Set status to 'inactive'
        );

        // Step 5: Update the PromotionHeader itself
        const result = await PromotionHeader.findByIdAndUpdate(
            promotionHeaderId,
            { $set: { isActive: false } }, // Set isActive to false
            { new: true }
        );

        if (!result) {
            messages.push('Không tìm thấy chương trình khuyến mãi');
        } else {
            messages.push('Đã cập nhật chương trình khuyến mãi thành công');
        }

        // Optionally: Retrieve the updated promotion list
        const allPromotion = await getAllPromotion();
        return {
            message: messages,
            data: allPromotion,
        };
    } catch (error) {
        const allPromotion = await getAllPromotion();
        messages.push('Lỗi khi cập nhật chương trình khuyến mãi: ' + error.message);
        return {
            message: messages,
            data: allPromotion,
        };
    }
};

    const deletePromotionLine = async (promotionLineId) => {
        const messages = [];
        try {
            // Step 1: Update all PromotionDetail documents related to the PromotionLine
            const detailsUpdated = await PromotionDetail.updateMany(
                { promotionLine_id: promotionLineId },
                { $set: { isActive: false } }
            );
    
            // Step 2: Update the PromotionLine instead of deleting it
            const result = await PromotionLine.findByIdAndUpdate(
                promotionLineId,
                { $set: { isActive: false, status: 'inactive' } },
                { new: true } // Return the updated document
            );
    
            if (!result) {
                messages.push('Không tìm thấy dòng khuyến mãi');
            } else {
                messages.push('Đã cập nhật dòng khuyến mãi thành công');
            }
    
            // Optionally: Retrieve the updated promotion list
            const allPromotion = await getAllPromotion();
            return {
                message: messages,
                data: allPromotion,
            };
        } catch (error) {
            messages.push('Lỗi khi cập nhật dòng khuyến mãi và chi tiết: ' + error.message);
            return {
                message: messages,
                data: await getAllPromotion(),
            };
        }
    };
    
    
    const deletePromotionDetail = async (id) => {
        const messages = [];
        try {
            const result = await PromotionDetail.findByIdAndUpdate(
                id,
                { $set: { isActive: false } },  // Update isActive to false
                { new: true }  // This will return the updated document
            );
            
            if (!result) {
                messages.push('Không tìm thấy chi tiết khuyến mãi');
            } else {
                messages.push('Đã xóa chi tiết khuyến mãi thành công');
            }
    
            const allPromotion = await getAllPromotion();
            return {
                message: messages,
                data: allPromotion,
            };
        } catch (error) {
            messages.push('Lỗi khi xóa chi tiết khuyến mãi: ' + error.message);
            return {
                message: messages,
                data: await getAllPromotion(),
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
    getAllPromotionActive,
    deletePromotionHeader,
    deletePromotionLine,
    deletePromotionDetail
};

