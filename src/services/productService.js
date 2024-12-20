const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const TransactionInventory = require("../models/TransactionInventory");
const PromotionHeader = require("../models/Promotion_Header");
const ProductPriceDetail = require("../models/ProductPrice_Detail");
const PromotionLine = require("../models/Promotion_Line");
const PromotionDetail = require("../models/Promotion_Detail");
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

async function getAllCategory() {
  try {
    const categories = await Category.find();

    const categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        const products = await Product.find({ category_id: category._id });
        return {
          ...category.toObject(),
          products: products,
        };
      })
    );

    return categoriesWithProducts;
  } catch (err) {
    throw new Error(`Error getting all categories: ${err.message}`);
  }
}

const deleteCategory = async (categoryId) => {
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await Category.deleteOne({ _id: categoryId });
    return { message: 'Category deleted successfully' };
  }
  catch (error) {
    throw new Error('Error deleting category: ' + error.message);
  }
}

async function getAllCategoryWithPrice() {
  try {
    const categories = await Category.find();

    const categoriesWithProducts = await Promise.all(
      categories.map(async (category) => {
        const products = await Product.find({ category_id: category._id });
        return {
          ...category.toObject(),
          products: products,
        };
      })
    );

    return categoriesWithProducts;
  } catch (err) {
    throw new Error(`Error getting all categories: ${err.message}`);
  }
}

async function addCategory(categoryData) {
  try {
    const category = new Category(categoryData);
    await category.save();
    return category;
  } catch (err) {
    throw new Error(`Error adding category: ${err.message}`);
  }
}

async function updateCategory(categoryId, categoryData) {
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    category.set(categoryData);
    await category.save();
    return category;
  } catch (err) {
    throw new Error(`Error removing category: ${err.message}`);
  }
}

async function getAllProduct() {
  try {
    const products = await Product.find()
      .populate("unit_id", "description")
      .populate("unit_convert.unit", "description");
    return products;
  } catch (err) {
    throw new Error(`Error getting all products: ${err.message}`);
  }
}

async function getProductsBySupplierId(supplierId) {
  try {
    const products = await Product.find({ supplier_id: supplierId });
    return products;
  } catch (err) {
    throw new Error(`Error getting products by supplier id: ${err.message}`);
  }
}

async function getProductsDetail(productId) {
  try {
    const product = await Product.findById(productId)
      .populate("unit_id", "description")
      .populate("supplier_id", "name phone email")
      .populate("category_id", "name");

    if (!product) {
      throw new Error("Product not found");
    }

    // Tìm các giao dịch kho hàng có product_id tương ứng
    const transactions = await TransactionInventory.find({
      product_id: productId,
    });

    const productObject = product.toObject();

    // Tìm các kho hàng có product_id tương ứng
    const warehouses = await Warehouse.findOne({
      item_code: productObject.item_code,
    });

    // Trả về đối tượng sản phẩm cùng với các giao dịch kho hàng
    return {
      ...productObject,
      transactions: transactions,
      warehouse: warehouses,
    };
  } catch (err) {
    throw new Error(`Error getting product detail: ${err.message}`);
  }
}

const addProductWithWarehouse = async (productData) => {
  const session = await mongoose.startSession(); // Bắt đầu session
  session.startTransaction(); // Bắt đầu transaction

  try {
    const { item_code, barcode, unit_convert } = productData;

    // Bước 1: Kiểm tra xem sản phẩm với cùng item_code và unit_id đã tồn tại chưa
    const existingProduct = await Product.findOne({ item_code }).session(session);

    if (existingProduct) {
      throw new Error("Sản phẩm với mã hàng đã tồn tại");
    }

    // Bước 3: Kiểm tra và thêm unit_id nếu checkBaseUnit là true
    let baseUnitId = null;
    let baseUnitBarcode = null;
    let baseUnitImg = null;
    if (unit_convert && Array.isArray(unit_convert)) {
      const baseUnits = unit_convert.filter(unit => unit.checkBaseUnit === true);
      if (baseUnits.length === 0) {
        throw new Error("Phải có 1 đơn vị cơ bản được chọn");
      }
      if (baseUnits.length > 1) {
        throw new Error("Chỉ được phép có một đơn vị cơ bản");
      }
      if (baseUnits[0].barcode) {
        const existingBarcode = await Product.findOne({ barcode }).session(session);
        if (existingBarcode) {
          throw new Error(`Sản phẩm với mã barcode ${baseUnits[0].barcode} này đã tồn tại.`);
        }
      }

      baseUnitId = baseUnits[0].unit;
      baseUnitBarcode = baseUnits[0].barcode;
      baseUnitImg = baseUnits[0].img;
    } else {
      throw new Error("unit_convert phải là một mảng và không được rỗng.");
    }

    // Bước 4: Tạo sản phẩm và lưu vào CSDL với session
    const product = new Product({
      ...productData,
      unit_id: baseUnitId,
      barcode: baseUnitBarcode,
      img: baseUnitImg,
    });
    await product.save({ session });

    // Bước 5: Tạo item_code cho từng đơn vị trong unit_convert
    for (const unit of unit_convert) {

      const existingUnitWarehouse = await Warehouse.findOne({ item_code: item_code, unit_id: unit.unit }).session(session);

      if (!existingUnitWarehouse) {
        const newUnitWarehouse = new Warehouse({
          item_code: item_code,
          unit_id: unit.unit,
          stock_quantity: 0,
        });

        await newUnitWarehouse.save({ session });
        console.log("New warehouse created for unit:", newUnitWarehouse);
      } else {
        console.log("Warehouse with this unit item_code already exists.");
      }
    }

    // Nếu tất cả đều thành công, commit transaction
    await session.commitTransaction();
    session.endSession();

    return product;
  } catch (err) {
    // Nếu có lỗi, rollback transaction
    await session.abortTransaction();
    session.endSession();
    throw new Error(`${err.message}`);
  }
};

const updateProduct = async (productId, productData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error("Product not found");
    }

    const { item_code, unit_convert: incomingUnits } = productData;

    // Bước 1: Kiểm tra xem sản phẩm với cùng item_code và unit_id đã tồn tại chưa
    const existingProduct = await Product.findOne({ item_code }).session(session);
    if (
      existingProduct &&
      existingProduct._id.toString() !== productId.toString()
    ) {
      throw new Error("Sản phẩm với item_code này đã tồn tại.");
    }

    // Bước 2: Cập nhật thông tin sản phẩm
    const existingUnits = product.unit_convert || [];
    const incomingUnitIds = incomingUnits.map(unit => unit.unit.toString());

    // Step 2: Mark units not in incoming data as inactive
    for (const existingUnit of existingUnits) {
      if (!incomingUnitIds.includes(existingUnit.unit.toString())) {
        existingUnit.status = false;
      }
    }

    // Step 3: Update or add units from incoming data
    incomingUnits.forEach(incomingUnit => {
      const matchingUnitIndex = existingUnits.findIndex(
        unit => unit.unit.toString() === incomingUnit.unit.toString()
      );

      if (matchingUnitIndex !== -1) {
        // Nếu đơn vị đã tồn tại và bị gắn false, chuyển thành true
        if (!existingUnits[matchingUnitIndex].status) {
          existingUnits[matchingUnitIndex].status = true; // Đổi thành true
        }

        // Cập nhật thông tin cho đơn vị hiện tại
        existingUnits[matchingUnitIndex] = {
          ...existingUnits[matchingUnitIndex],
          ...incomingUnit
        };
      } else {
        // Thêm mới đơn vị nếu không tồn tại
        existingUnits.push(incomingUnit);
      }
    });

    // Step 4: Assign the merged unit_convert array to the product
    product.unit_convert = existingUnits;

    // Update other product fields
    product.set({ ...productData, unit_convert: existingUnits });

    // Bước 3: Kiểm tra và cập nhật unit_id nếu checkBaseUnit là true
    let baseUnitId = null;
    let baseUnitBarcode = null;
    let baseUnitImg = null;
    if (incomingUnits && Array.isArray(incomingUnits)) {
      const baseUnits = incomingUnits.filter(unit => unit.checkBaseUnit === true);
      if (baseUnits.length === 0) {
        throw new Error("Phải có 1 đơn vị cơ bản được chọn");
      }
      if (baseUnits.length > 1) {
        throw new Error("Chỉ được phép có một đơn vị cơ bản");
      }
      if (baseUnits[0].barcode) {
        const existingBarcode = await Product.findOne({ barcode: baseUnits[0].barcode }).session(session);
        if (existingBarcode && existingBarcode._id.toString() !== productId.toString()) {
          throw new Error(`Sản phẩm với mã barcode ${baseUnits[0].barcode} này đã tồn tại.`);
        }
      }

      baseUnitId = baseUnits[0].unit;
      baseUnitBarcode = baseUnits[0].barcode;
      baseUnitImg = baseUnits[0].img;
    } else {
      throw new Error("unit_convert phải là một mảng và không được rỗng.");
    }

    product.unit_id = baseUnitId;
    product.barcode = baseUnitBarcode;
    product.img = baseUnitImg;

    // Bước 4: Cập nhật thông tin trong unit_convert và Warehouse
    for (const unit of incomingUnits) {
      const existingUnitWarehouse = await Warehouse.findOne({ item_code: item_code, unit_id: unit.unit }).session(session);

      if (!existingUnitWarehouse) {
        const newUnitWarehouse = new Warehouse({
          item_code: item_code,
          unit_id: unit.unit,
          stock_quantity: 0,
        });

        await newUnitWarehouse.save({ session });
        console.log("New warehouse created for unit:", newUnitWarehouse);
      } else {
        console.log("Warehouse with this unit item_code already exists.");
      }
    }

    // Lưu các thay đổi vào cơ sở dữ liệu
    await product.save({ session });

    await session.commitTransaction(); // Hoàn thành transaction
    session.endSession(); // Kết thúc session

    return product;
  } catch (err) {
    await session.abortTransaction(); // Hủy transaction nếu có lỗi
    session.endSession(); // Kết thúc session
    throw new Error(`${err.message}`);
  }
};


async function getAllProductsWithPriceAndPromotion() {
  try {
    // Lọc ProductPriceDetail chỉ lấy những bản ghi có ProductPriceHeader đang hoạt động
    const currentDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);

    const productPrices = await ProductPriceDetail.find({
      isActive: true,
      productPriceHeader_id: { $ne: null }, // Exclude records that do not have a ProductPriceHeader_id
    })
      .populate({
        path: 'productPriceHeader_id',
        match: {
          status: 'active',          // Only get ProductPriceHeader with status 'active'
          isActive: true,            // Only get ProductPriceHeader with isActive = true
          startDate: { $lte: currentDate }, // Only get headers where startDate is less than or equal to the current date
          endDate: { $gte: currentDate },   // Only get headers where endDate is greater than or equal to the current date
        },
        select: 'description startDate endDate isActive status', // Select only relevant fields
      })
      .populate({
        path: 'unit_id', // Populate unit_id for each ProductPriceDetail
      });
    
    // Filter out any ProductPriceDetail without a valid productPriceHeader_id
    const filteredProductPrices = productPrices.filter(
      (priceDetail) => priceDetail.productPriceHeader_id !== null
    );
    
    console.log(currentDate)
    console.log(filteredProductPrices)
    
    // Lấy tất cả PromotionHeader đang hoạt động
    const activePromotionHeaders = await PromotionHeader.find({isActive: true});
    const today = new Date();
    // Lấy tất cả PromotionLine có liên kết với PromotionHeader đang hoạt động
    const activePromotionLines = await PromotionLine.find({
      promotionHeader_id: {
        $in: activePromotionHeaders.map((header) => header._id),
      },
      status: 'active',
      isActive:true,
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    // Lấy tất cả PromotionDetail đang hoạt động dựa trên promotionLine_id
    const activePromotionDetails = await PromotionDetail.find({
      promotionLine_id: { $in: activePromotionLines.map((line) => line._id) },
    }).populate("product_id product_donate unit_id unit_id_donate");

    // Khởi tạo đối tượng để phân loại sản phẩm theo danh mục
    const productsByCategory = {};

    // Mảng để lưu trữ item codes để tìm sản phẩm
    const itemCodes = filteredProductPrices.map(priceDetail => priceDetail.item_code);

    // Lấy tất cả sản phẩm liên quan đến item_code
    const products = await Product.find({ item_code: { $in: itemCodes } }).populate("category_id");

    // Duyệt qua từng productPrice để phân loại theo danh mục
    for (const priceDetail of filteredProductPrices) {
      const product = products.find(p => p.item_code === priceDetail.item_code);
      let promotions = [];

      if (product) {
        // Tìm các khuyến mãi áp dụng cho sản phẩm hiện tại
        for (const promoHeader of activePromotionHeaders) {
          const promoLines = activePromotionLines.filter(line => 
            line.promotionHeader_id.equals(promoHeader._id) && line.isActive === true
          );
          

          for (const promoLine of promoLines) {
            const promoDetails = activePromotionDetails.filter(detail => detail.promotionLine_id.equals(promoLine._id)  && detail.isActive === true);

            for (const promoDetail of promoDetails) {
              if ((promoDetail.product_id && promoDetail.product_id.equals(product._id)) && (promoDetail.unit_id && promoDetail.unit_id.equals(priceDetail.unit_id._id)) || (promoDetail.product_donate && promoDetail.product_donate.equals(product._id)) && (promoDetail.unit_id_donate && promoDetail.unit_id_donate.equals(priceDetail.unit_id._id))) {
                promotions.push({
                  _id: promoDetail._id,
                  header: promoHeader.description,
                  line: promoLine.description,
                  type: promoLine.type,
                  startDate: promoLine.startDate,
                  endDate: promoLine.endDate,
                  percent: promoDetail.percent,
                  amount_sales: promoDetail.amount_sales,
                  product_donate: promoDetail.product_donate,
                  unit_id_donate: promoDetail.unit_id_donate,
                  quantity_donate: promoDetail.quantity_donate,
                  product_id: promoDetail.product_id,
                  unit_id: promoDetail.unit_id,
                  quantity: promoDetail.quantity,
                  amount_donate: promoDetail.amount_donate,
                  amount_limit: promoDetail.amount_limit,
                  description: promoDetail.description,

                });
              }
            }
          }
        }

        // Lấy danh mục của sản phẩm
        const categoryId = product.category_id._id.toString();
        const image = product.unit_convert.find((unit) => unit.unit.equals(priceDetail.unit_id._id));

        const productData = {
          _id: product._id,
          name: product.name,
          barcode: image?.barcode,
          category_id: product.category_id._id,
          item_code: product.item_code,
          unit_id: priceDetail.unit_id,
          img: image?.img,
          price: priceDetail.price,
          priceDetail: priceDetail,
          promotions: promotions,
          unit_convert: product.unit_convert,
        };

        // Nếu danh mục chưa có trong đối tượng, khởi tạo mảng
        if (!productsByCategory[categoryId]) {
          productsByCategory[categoryId] = {
            category: product.category_id,
            products: [],
          };
        }

        // Thêm sản phẩm vào danh mục tương ứng
        productsByCategory[categoryId].products.push(productData);
      }
    }

    // Sắp xếp sản phẩm trong từng danh mục theo số lượng khuyến mãi giảm dần
    for (const category in productsByCategory) {
      productsByCategory[category].products.sort((a, b) => {
        return b.promotions.length - a.promotions.length;
      });
    }

    return Object.values(productsByCategory); // Trả về danh sách các danh mục với sản phẩm của chúng
  } catch (err) {
    throw new Error(
      `Error getting products with price and promotions: ${err.message}`
    );
  }
}


async function getAllProductsWithPriceAndPromotionNoCategory() {
  try {
    
    const currentDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);

    const productPrices = await ProductPriceDetail.find({
      isActive: true,
      productPriceHeader_id: { $ne: null }, // Exclude records that do not have a ProductPriceHeader_id
    })
      .populate({
        path: 'productPriceHeader_id',
        match: {
          status: 'active',          // Only get ProductPriceHeader with status 'active'
          isActive: true,            // Only get ProductPriceHeader with isActive = true
          startDate: { $lte: currentDate }, // Only get headers where startDate is less than or equal to the current date
          endDate: { $gte: currentDate },   // Only get headers where endDate is greater than or equal to the current date
        },
        select: 'description startDate endDate isActive status', // Select only relevant fields
      })
      .populate({
        path: 'unit_id', // Populate unit_id for each ProductPriceDetail
      });
    
    // Filter out any ProductPriceDetail without a valid productPriceHeader_id
    const filteredProductPrices = productPrices.filter(
      (priceDetail) => priceDetail.productPriceHeader_id !== null
    );
    
    
    // Get all active PromotionHeader
    const activePromotionHeaders = await PromotionHeader.find({isActive: true});
    const today = new Date();
    // Get all active PromotionLine linked to active PromotionHeader
    const activePromotionLines = await PromotionLine.find({
      promotionHeader_id: {
        $in: activePromotionHeaders.map((header) => header._id),
      },
      isActive: true,
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    // Get all active PromotionDetail based on promotionLine_id
    const activePromotionDetails = await PromotionDetail.find({ 
      isActive: true,
      promotionLine_id: { $in: activePromotionLines.map((line) => line._id) },
    }).populate("product_id product_donate unit_id unit_id_donate");

    // Array to store item codes to find products
    const itemCodes = filteredProductPrices.map(priceDetail => priceDetail.item_code);

    // Get all products related to item_code
    const products = await Product.find({ item_code: { $in: itemCodes } }).populate("category_id");

    // Initialize product list
    const productsList = [];

    // Loop through each productPrice to classify by category
    for (const priceDetail of filteredProductPrices) {
      const product = products.find(p => p.item_code === priceDetail.item_code);
      let promotions = [];

      if (product) {
        // Find promotions applicable to the current product
        for (const promoHeader of activePromotionHeaders) {
          const promoLines = activePromotionLines.filter(line => line.promotionHeader_id.equals(promoHeader._id));

          for (const promoLine of promoLines) {
            const promoDetails = activePromotionDetails.filter(detail => detail.promotionLine_id.equals(promoLine._id));

            for (const promoDetail of promoDetails) {
              if (
                (promoDetail.product_id && promoDetail.product_id.equals(product._id) && promoDetail.unit_id.equals(priceDetail.unit_id._id)) ||
                (promoDetail.product_donate && promoDetail.product_donate.equals(product._id) && promoDetail.unit_id_donate.equals(priceDetail.unit_id._id))
              ) {
                promotions.push({
                  _id:promoDetail._id,
                  header: promoHeader.description,
                  line: promoLine.description,
                  type: promoLine.type,
                  startDate: promoLine.startDate,
                  endDate: promoLine.endDate,
                  percent: promoDetail.percent,
                  amount_sales: promoDetail.amount_sales,
                  product_donate: promoDetail.product_donate,
                  unit_id_donate: promoDetail.unit_id_donate,
                  quantity_donate: promoDetail.quantity_donate,
                  product_id: promoDetail.product_id,
                  unit_id: promoDetail.unit_id,
                  quantity: promoDetail.quantity,
                  amount_donate: promoDetail.amount_donate,
                  amount_limit: promoDetail.amount_limit,
                  description: promoDetail.description,
                });
              }
            }
          }
        }

        // Construct the product data
        const image = product.unit_convert.find((unit) => unit.unit.equals(priceDetail.unit_id._id));
        productsList.push({
          _id: product._id,
          name: product.name,
          item_code: product.item_code,
          category_id: product.category_id ? product.category_id._id : null,
          barcode: product.barcode,
          unit_id: priceDetail.unit_id,
          img: image?.img,
          price: priceDetail.price,
          priceDetail: priceDetail,
          promotions: promotions,
          unit_convert: product.unit_convert,
        });
      }
    }

    // Sort products by the number of promotions in descending order
    productsList.sort((a, b) => b.promotions.length - a.promotions.length);

    return productsList; // Return the list of products
  } catch (err) {
    throw new Error(`Error getting products with price and promotions: ${err.message}`);
  }
}

async function getProductsByBarcodeInUnitConvert(barcode) {
  try {
    const today = new Date(new Date().getTime() + 2 * 60 * 60 * 1000);
    // Tìm sản phẩm theo mã vạch
    const product = await Product.findOne({ 'unit_convert.barcode': barcode }).populate('unit_convert.unit');

    if (!product) {
      return { message: 'Không tìm thấy sản phẩm.' };
    }
   
    // Tìm giá sản phẩm dựa trên item_code hoặc một trường phù hợp khác
    const productPriceDetails = await ProductPriceDetail.find({
      isActive: true,
      item_code: product.item_code, // Hoặc có thể dùng trường khác để tìm
    })
      .populate({
        path: 'unit_id',
      })
      .populate({
        path: 'productPriceHeader_id', // assuming the reference to productPriceHeader is 'productPriceHeader_id'
        match: { status: 'active' , isActive:true ,startDate: { $lte: today },endDate: { $gte:today  }
      },
      });

    // Lọc ra các ProductPriceDetail có productPriceHeader_id là active
    const activeProductPriceDetails = productPriceDetails.filter(detail => detail.productPriceHeader_id !== null);

    console.log(activeProductPriceDetails);

    if (activeProductPriceDetails.length > 0) {
      const priceMap = {};
      activeProductPriceDetails.forEach(detail => {
        priceMap[detail.unit_id._id.toString()] = detail.price; // Sử dụng ID của đơn vị làm khóa
      });

      return {
        _id: product._id,
        name: product.name,
        barcode: product.unit_convert.find((unit) => unit.barcode === barcode).barcode,
        unit_id: product.unit_convert.find((unit) => unit.barcode === barcode).unit,
        img: product.img,
        unit_converts: product.unit_convert
        .filter(unit => priceMap[unit.unit._id.toString()]) // Lọc bỏ các unit_convert không có giá
        .map(unit => ({
          unit: unit.unit,
          quantity: unit.quantity,
          barcode: unit.barcode,
          img: unit.img,
          checkBaseUnit: unit.checkBaseUnit,
          price: priceMap[unit.unit._id.toString()], // Lấy giá từ priceMap
        })),
      };
    } else {
      return { message: 'Không tìm thấy giá sản phẩm cho sản phẩm này.' };
    }
  } catch (err) {
    throw new Error(`Không tìm thấy sản phẩm: ${err.message}`);
  }
}


module.exports = {
  getAllCategory,
  addCategory,
  deleteCategory,
  updateCategory,
  getAllProduct,
  getProductsBySupplierId,
  getProductsDetail,
  addProductWithWarehouse,
  updateProduct,
  getAllProductsWithPriceAndPromotion,
  getAllProductsWithPriceAndPromotionNoCategory,
  getProductsByBarcodeInUnitConvert,
  getAllCategoryWithPrice
};
