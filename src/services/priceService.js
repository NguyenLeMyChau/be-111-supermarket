const ProductPriceHeader = require("../models/ProductPrice_Header");
const ProductPriceDetail = require("../models/ProductPrice_Detail");
const Product = require("../models/Product");
const Unit = require("../models/Unit");

async function getAllProductPriceHeader() {
  try {
    const productPriceHeaders = await ProductPriceHeader.find({isActive:true});
    return productPriceHeaders;
  } catch (err) {
    throw new Error(`Error fetching product prices: ${err.message}`);
  }
}
async function getAllProductPrices() {
  try {
    const productPriceHeaders = await ProductPriceHeader.find({isActive:true});
    const productPricesWithDetails = await Promise.all(
      productPriceHeaders.map(async (header) => {
        const productPriceDetails = await ProductPriceDetail.find({
          productPriceHeader_id: header._id,isActive:true
        }).populate("unit_id");;

        const detailedProductPrices = await Promise.all(
          productPriceDetails.map(async (detail) => {
            const products = await Product.find({
              'unit_convert.unit': detail.unit_id,
              item_code: detail.item_code
            }).populate("category_id");
            const product = products.length > 0 ? products[0] : null;
        
            return {
              ...detail.toObject(),
              product: product
                ? {
                    name: product.name,
                    category_id: product.category_id,
                    supplier_id: product.supplier_id
                  }
                : null // Trả về null nếu không tìm thấy sản phẩm
            };
          })
        );

        return {
          ...header.toObject(),
          productPrices: detailedProductPrices,
        };
      })
    );
    // Sắp xếp theo product.category_id và product.name
    const sortedProductPrices = productPricesWithDetails.map((header) => ({
      ...header,
      productPrices: header.productPrices.sort((a, b) => {
        // So sánh category_id
        if (a.product?.category_id < b.product?.category_id) return -1;
        if (a.product?.category_id > b.product?.category_id) return 1;

        // Nếu category_id giống nhau, so sánh name
        if (a.product?.name < b.product?.name) return -1;
        if (a.product?.name > b.product?.name) return 1;

        return 0;
      }),
    }));

    return sortedProductPrices;
  } catch (err) {
    throw new Error(`Error fetching product prices: ${err.message}`);
  }
}
const getpriceDetail = async (productPriceHeader_id) => {
  try {
    // Tìm kiếm các chi tiết giá sản phẩm theo `productPriceHeader_id`
    const productPriceDetails = await ProductPriceDetail.find({
      productPriceHeader_id: productPriceHeader_id,
      isActive:true
    }).populate("unit_id");

    // Lấy chi tiết sản phẩm cùng với thông tin bổ sung từ `Product`
    const detailedProductPrices = await Promise.all(
      productPriceDetails.map(async (detail) => {
        const products = await Product.find({
          'unit_convert.unit': detail.unit_id,
          item_code: detail.item_code
        }).populate("category_id");

        // Chỉ lấy sản phẩm đầu tiên nếu tìm thấy, hoặc null nếu không có sản phẩm phù hợp
        const product = products.length > 0 ? products[0] : null;

        return {
          ...detail.toObject(),
          product: product
            ? {
                name: product.name,
                category_id: product.category_id,
                supplier_id: product.supplier_id,
              }
            : null // Trả về null nếu không tìm thấy sản phẩm
        };
      })
    );

    // Sắp xếp theo category_id và name
    const sortedProductPrices = detailedProductPrices.sort((a, b) => {
      // So sánh `category_id`
      if (a.product?.category_id < b.product?.category_id) return -1;
      if (a.product?.category_id > b.product?.category_id) return 1;

      // Nếu `category_id` giống nhau, so sánh `name`
      if (a.product?.name < b.product?.name) return -1;
      if (a.product?.name > b.product?.name) return 1;

      return 0;
    });

    return sortedProductPrices;
  } catch (error) {
    throw new Error('Lỗi khi lấy chi tiết giá sản phẩm: ' + error.message);
  }
};

const copyProductPrice = async (productPriceData,id) => {
  const { description, startDate, endDate, status } = productPriceData;
  try {
    // Step 1: Find the active ProductPriceHeader
    const activeHeader = await ProductPriceHeader.findById(id);
    if (!activeHeader) {
      throw new Error('Không tìm thấy chương trình để sao chép');
    }
    // Step 2: Get all ProductPriceDetails for the active header
    const activePriceDetails = await ProductPriceDetail.find({
      productPriceHeader_id: activeHeader._id,
      isActive:true
    });
    // Step 3: Create the new ProductPriceHeader  
    const newProductPrice = new ProductPriceHeader({
      description,
      startDate,
      endDate,
      status,
    });
    const savedHeader = await newProductPrice.save();

    // Step 4: Copy the ProductPriceDetails to the new header
    const newPriceDetails = activePriceDetails.map((detail) => ({
      productPriceHeader_id: savedHeader._id,
      item_code: detail.item_code,
      unit_id:detail.unit_id,
      price: detail.price,
    }));
    // Save all new ProductPriceDetail records
    await ProductPriceDetail.insertMany(newPriceDetails);
    
    const allProductPrices = await getAllProductPrices();
    return allProductPrices;
  } catch (error) {
    throw new Error('Lỗi thêm chương trình giá' + error.message);
  }
};
const addProductPrice = async (productPriceData) => {
  const { description, startDate, endDate, status } = productPriceData;

  try {
    // Tạo mới ProductPriceHeader
    const newProductPrice = new ProductPriceHeader({
      description,
      startDate,
      endDate,
      status,
    });
   const savedHeader = await newProductPrice.save();

    // Gọi getAllProductPrices để lấy danh sách tất cả giá sản phẩm sau khi thêm thành công
    const allProductPrices = await getAllProductPrices();

    return allProductPrices;
  } catch (error) {
    throw new Error('Lỗi thêm chương trình giá: ' + error.message);
  }
};


const updateProductPrice = async (priceId, updateData) => {
  const messages = []; // Mảng chứa các thông báo phản hồi
  console.log(updateData)
  const enddate = new Date(new Date(updateData.endDate)); // Chuyển updateData.endDate về đối tượng Date nếu cần
  const startdate = new Date(new Date(updateData.startDate)); 
  const startDate = new Date(updateData.startDate);
  // updateData.endDate = new Date(startDate.setHours(23, 59, 59, 999));

  console.log(enddate)
  try {
    const today = new Date(new Date().getTime() + 2 * 60 * 60 * 1000);
    console.log(today)
    // Nếu status là 'active', kiểm tra item_code trùng lặp
    if (updateData.status === 'active') {
      // Lấy thông tin chương trình giá hiện tại để kiểm tra chi tiết
      const existingPrice = await ProductPriceHeader.findById(priceId);
      if (!existingPrice) {
        messages.push('Không tìm thấy chương trình giá');
        return { updatedPrice: null, messages };
      }

      // Lấy các chi tiết sản phẩm từ ProductPriceDetail dựa trên ProductPriceHeader hiện tại
      const existingDetails = await ProductPriceDetail.find({ productPriceHeader_id: priceId, isActive: true });
      const itemCodes = existingDetails.map(detail => detail.item_code);

      // Kiểm tra trùng lặp trong các ProductPriceHeader khác đang active với điều kiện startDate và endDate
      const duplicateItem = await ProductPriceDetail.aggregate([
        {
          $match: {
            productPriceHeader_id: { $ne: priceId }, // Loại bỏ chính bản thân ProductPriceHeader
            item_code: { $in: itemCodes } // Kiểm tra trùng item_code
          }
        },
        {
          $lookup: {
            from: 'productPrice_header', // Tên collection của ProductPriceHeader
            localField: 'productPriceHeader_id',
            foreignField: '_id',
            as: 'header'
          }
        },
        {
          $unwind: '$header'
        },
        {
          $match: {
            'header.status': 'active', // Chỉ tìm các ProductPriceHeader đang "active"
            'header.isActive': true, // Chỉ tìm các ProductPriceHeader có isActive = true
          }
        },
        {
          $match: {
            // Kiểm tra nếu startDate và endDate của header hiện tại không nằm trong khoảng startDate và endDate của các header khác có cùng item_code
            $or: [
              {
                $and: [
                   { 'header.startDate': { $gte: startdate } }, // startDate của header hiện tại phải sau endDate của các header khác
                  { 'header.startDate': { $lte: enddate} }  // endDate của header hiện tại phải sau endDate của các header khác
                ]
              },
              {
                $and: [
                   { 'header.endDate': { $lte: enddate } }, // startDate của header hiện tại phải trước startDate của các header khác
                  { 'header.endDate': { $gte:  startdate} }  // endDate của header hiện tại phải trước startDate của các header khác
                ]
              }
            ]
          }
        },
        {
          $limit: 1 // Giới hạn chỉ lấy 1 kết quả
        }
      ]);
      console.log(duplicateItem)
      if (duplicateItem.length > 0) {
        // Lấy danh sách tất cả giá sản phẩm sau khi cập nhật thành công
        const allProductPrices = await getAllProductPrices();

        // Thêm thông báo trùng lặp vào messages
        console.log("dsadasdsa",updateData)
        console.log(duplicateItem[0].header)
        messages.push(`Đã có sản phẩm trùng lặp với bảng giá khác đang hoạt động (ID: ${duplicateItem[0].header.description})`);
        return { updatedPrice: null, allProductPrices, messages };
      }
    }

    // Tiến hành cập nhật giá sản phẩm
    const updatedPrice = await ProductPriceHeader.findByIdAndUpdate(
      priceId,
      updateData,
      { new: true, runValidators: true }
    );

    // Lấy danh sách tất cả giá sản phẩm sau khi cập nhật thành công
    const allProductPrices = await getAllProductPrices();

    // Thêm thông báo cập nhật thành công
    messages.push('Cập nhật sản phẩm thành công');

    // Trả về danh sách tất cả giá sản phẩm và thông báo
    return { updatedPrice, allProductPrices, messages };
  } catch (error) {
    // Thêm thông báo lỗi vào mảng messages
    messages.push('Lỗi cập nhật sản phẩm');
    console.log(error)
    // Trả về null và messages nếu có lỗi
    return { updatedPrice: null, allProductPrices: null, messages };
  }
};





const addProductPriceDetail = async (priceDetailData) => {
  const { productPriceHeader_id, item_code, unit_id, price } = priceDetailData;

  try {
    // Kiểm tra xem chương trình giá có tồn tại không
    const headerExists = await ProductPriceHeader.findById(productPriceHeader_id);
    if (!headerExists) {
      throw new Error(`Chương trình giá không tồn tại`);
    }

    // Kiểm tra nếu sản phẩm với `item_code` và `unit_id` đã tồn tại trong `ProductPriceDetail`
    const existingPriceDetail = await ProductPriceDetail.findOne({
      productPriceHeader_id,
      item_code,
      unit_id,
    });

    if (existingPriceDetail) {
      // Nếu sản phẩm đã tồn tại, cập nhật giá thay vì thêm mới
      existingPriceDetail.price = price;
      existingPriceDetail.isActive = true;
      await existingPriceDetail.save();
      // const allProductPriceDetail = await getpriceDetail(productPriceHeader_id);
      const allProductPriceDetail = await getAllProductPrices();
      return { message:  'Đã cập nhật giá thành công', data: allProductPriceDetail };
    } else {
      // Nếu sản phẩm chưa tồn tại, thêm mới giá
      const newProductPriceDetail = new ProductPriceDetail({
        productPriceHeader_id,
        item_code,
        unit_id,
        price
      });

      await newProductPriceDetail.save();
      // const allProductPriceDetail = await getpriceDetail(productPriceHeader_id);
      const allProductPriceDetail = await getAllProductPrices();
      return { message: 'Thêm giá sản phẩm thành công', data: allProductPriceDetail };
    }
  } catch (error) {
    throw new Error('Thêm giá sản phẩm thất bại: ' + error.message);
  }
};

const updatePriceDetail = async (priceDetailid, updateData) => {
  try {
    // Check if the ProductPriceHeader exists
    const headerExists = await ProductPriceHeader.findById(updateData.productPriceHeader_id);
    if (!headerExists) {
      throw new Error(`Chương trình giá không tồn tại`);
    }

    // Find the ProductPriceDetail by ID and update it with the new data
    const updatedPriceDetail = await ProductPriceDetail.findByIdAndUpdate(
      priceDetailid,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPriceDetail) {
      throw new Error(`Sản phẩm không tồn tại giá`);
    }

    const allProductPriceDetail = await getAllProductPrices();
      return { message:  'Cập nhật giá thành công', data: allProductPriceDetail };
  } catch (error) {
    throw new Error('Cập nhật giá thất bại ' + error.message);
  }
};
async function getProductsWithoutPriceAndActivePromotion(productPriceHeader_id) {
  try {
    
    // Bước 1: Tìm các `item_code` và `unit_id` có liên kết với `productPriceHeader_id` trong `productPrice_detail`
    const productsWithPrice = await ProductPriceDetail.find({ productPriceHeader_id ,isActive:true})
      .select('item_code unit_id'); // Chọn `item_code` và `unit_id`
    
    // Lấy danh sách `item_code` và `unit_id` có trong `productPrice_detail`
    const itemCodesWithPrice = productsWithPrice.map(detail => detail.item_code);
    const unitIdsWithPrice = productsWithPrice.map(detail => detail.unit_id.toString());
    
    // Bước 2: Lọc các sản phẩm không có `item_code` và `unit_id` trong `productPrice_detail`
    const productsWithoutPrice = await Product.find({
      item_code: { $nin: itemCodesWithPrice }, // Lọc các `item_code` không nằm trong danh sách đã tìm
      "unit_convert.unit": { $nin: unitIdsWithPrice } // Kiểm tra các `unit_id` không tồn tại trong `unit_convert`
    }).populate("unit_id");
    return productsWithoutPrice;
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm không có giá:', error);
    throw error;
  }
}


const deleteProductPriceHeader = async (headerId) => {
  try {
    // Find the ProductPriceHeader by id
    const header = await ProductPriceHeader.findById(headerId);

    if (!header) {
      return { success: false, message: 'Không tìm thấy chương trình giá', allProductPrices: await getAllProductPrices() };
    }

    // Update the isActive field of the ProductPriceHeader to false
    header.isActive = false;
    await header.save(); // Save the updated ProductPriceHeader

    // Update the isActive field of the associated ProductPriceDetail documents
    await ProductPriceDetail.updateMany(
      { productPriceHeader_id: headerId },
      { $set: { isActive: false } } // Set isActive to false for all related details
    );

    // Fetch the updated list of product prices
    const allProductPrices = await getAllProductPrices();

    return { success: true, message: 'Xóa thành công', allProductPrices };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Cập nhật thất bại', allProductPrices: await getAllProductPrices() };
  }
};


const deleteProductPriceDetail = async (detailId) => {
  try {
    // Find the ProductPriceDetail by id
    const detail = await ProductPriceDetail.findById(detailId);

    // If the detail does not exist, return a message
    if (!detail) {
      return { success: false, message: 'Không tìm thấy giá cần xóa', allProductPrices: await getAllProductPrices() };
    }

    // Update the isStatus field to false instead of deleting the document
    detail.isActive = false;
    await detail.save();  // Save the updated document

    // Fetch the updated list of product prices
    const allProductPrices = await getAllProductPrices();

    return { success: true, message: 'Xóa thành công', allProductPrices };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Xóa thất bại', allProductPrices: await getAllProductPrices() };
  }
};


module.exports = {
  getAllProductPrices,
  addProductPrice,
  updateProductPrice,
  addProductPriceDetail,
  updatePriceDetail,
  getProductsWithoutPriceAndActivePromotion,copyProductPrice,
  deleteProductPriceHeader,
  deleteProductPriceDetail,
  getpriceDetail,
  getAllProductPriceHeader
};
