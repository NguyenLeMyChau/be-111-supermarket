const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const TransactionInventory = require("../models/TransactionInventory");
const PromotionHeader = require("../models/Promotion_Header");
const ProductPriceDetail = require("../models/ProductPrice_Detail");
const PromotionLine = require("../models/Promotion_Line");
const PromotionDetail = require("../models/Promotion_Detail");

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
    const products = await Product.find().populate("unit_id", "description");
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
    const { item_code, unit_id, barcode } = productData;

    // Bước 1: Kiểm tra xem sản phẩm với cùng item_code và unit_id đã tồn tại chưa
    const existingProduct = await Product.findOne({
      item_code,
      unit_id,
    }).session(session);
    if (existingProduct) {
      throw new Error("Sản phẩm với item_code");
    }

    // Bước 2: Kiểm tra xem barcode đã tồn tại chưa
    if (barcode) {
      const existingBarcode = await Product.findOne({ barcode }).session(session);
      if (existingBarcode) {
        throw new Error("Sản phẩm với mã barcode này đã tồn tại.");
      }
    }

    // Bước 3: Tạo sản phẩm và lưu vào CSDL với session
    const product = new Product(productData);
    await product.save({ session });

    // Bước 4: Kiểm tra item_code từ productData và tạo Warehouse mới
    if (item_code) {
      const existingWarehouse = await Warehouse.findOne({ item_code }).session(
        session
      );

      if (!existingWarehouse) {
        // Nếu chưa có, tạo Warehouse mới với item_code
        const newWarehouse = new Warehouse({
          item_code,
          stock_quantity: 0,
          min_stock_threshold: productData.min_stock_threshold,
        });

        await newWarehouse.save({ session });
        console.log("New warehouse created:", newWarehouse);
      } else {
        console.log("Warehouse with this item_code already exists.");
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
  const session = await mongoose.startSession(); // Nếu bạn đang sử dụng session cho transaction
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error("Product not found");
    }

    const { item_code, unit_id, barcode, min_stock_threshold } = productData;

    // Bước 1: Kiểm tra xem sản phẩm với cùng item_code và unit_id đã tồn tại chưa
    const existingProduct = await Product.findOne({
      item_code,
      unit_id,
    }).session(session);
    if (
      existingProduct &&
      existingProduct._id.toString() !== productId.toString()
    ) {
      throw new Error("Sản phẩm với item_code và đơn vị này đã tồn tại.");
    }

    // Bước 2: Kiểm tra xem barcode đã tồn tại chưa
    const existingBarcode = await Product.findOne({ barcode }).session(session);
    if (
      existingBarcode &&
      existingBarcode._id.toString() !== productId.toString()
    ) {
      throw new Error("Sản phẩm với mã barcode này đã tồn tại.");
    }

    // Bước 3: Tìm warehouse theo item_code và cập nhật min_stock_threshold
    const warehouse = await Warehouse.findOne({ item_code }).session(session);
    if (!warehouse) {
      throw new Error("Warehouse not found for this item_code");
    }

    // Cập nhật giá trị min_stock_threshold
    warehouse.min_stock_threshold = min_stock_threshold;
    await warehouse.save({ session });

    // Cập nhật product
    product.set(productData);
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
    const productPrices = await ProductPriceDetail.find({
      productPriceHeader_id: { $ne: null }, // Bỏ qua các bản ghi không có liên kết ProductPriceHeader
    })
      .populate({
        path: "product_id",
        populate: [
          {
            path: "unit_id",
            model: "unit",
          },
          {
            path: "category_id",
            model: "category",
          },
        ],
      })
      .populate({
        path: "productPriceHeader_id",
        match: { status: "active" }, // Chỉ lấy ProductPriceHeader có status là 'active'
      });

    // Lọc ra các bản ghi hợp lệ (loại bỏ những bản ghi có productPriceHeader_id là null)
    const filteredProductPrices = productPrices.filter(
      (priceDetail) => priceDetail.productPriceHeader_id !== null
    );

    // Lấy tất cả PromotionHeader đang hoạt động
    const activePromotionHeaders = await PromotionHeader.find({
      isActive: true,
    });

    // Lấy tất cả PromotionLine có liên kết với PromotionHeader đang hoạt động
    const activePromotionLines = await PromotionLine.find({
      promotionHeader_id: {
        $in: activePromotionHeaders.map((header) => header._id),
      },
      isActive: true,
    });

    // Lấy tất cả PromotionDetail đang hoạt động dựa trên promotionLine_id
    const activePromotionDetails = await PromotionDetail.find({
      promotionLine_id: { $in: activePromotionLines.map((line) => line._id) },
    }).populate("product_id product_donate");

    // Khởi tạo đối tượng để phân loại sản phẩm theo danh mục
    const productsByCategory = {};

    filteredProductPrices.forEach((priceDetail) => {
      const product = priceDetail.product_id;
      let promotions = [];

      // Tìm các khuyến mãi áp dụng cho sản phẩm hiện tại
      activePromotionHeaders.forEach((promoHeader) => {
        activePromotionLines
          .filter((line) => line.promotionHeader_id.equals(promoHeader._id))
          .forEach((promoLine) => {
            activePromotionDetails
              .filter((detail) => detail.promotionLine_id.equals(promoLine._id))
              .forEach((promoDetail) => {
                if (
                  promoDetail.product_id &&
                  promoDetail.product_id.equals(product._id)
                ) {
                  promotions.push({
                    header: promoHeader.description,
                    line: promoLine.description,
                    type: promoLine.type,
                    startDate: promoLine.startDate,
                    endDate: promoLine.endDate,
                    percent: promoDetail.percent,
                    amount_sales: promoDetail.amount_sales,
                    product_donate: promoDetail.product_donate,
                    quantity_donate: promoDetail.quantity_donate,
                    product_id: promoDetail.product_id,
                    quantity: promoDetail.quantity,
                    amount_donate: promoDetail.amount_donate,
                    amount_limit: promoDetail.amount_limit,
                  });
                }
              });
          });
      });

      // Lấy danh mục của sản phẩm
      const categoryId = product.category_id._id.toString();
      const productData = {
        _id: product._id,
        name: product.name,
        barcode: product.barcode,
        category_id: product.category_id._id,
        item_code: product.item_code,
        unit_id: product.unit_id,
        img: product.img,
        price: priceDetail.price,
        priceDetail: priceDetail,
        promotions: promotions,
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
    });

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
    // Filter ProductPriceDetail to only get records with active ProductPriceHeader
    const productPrices = await ProductPriceDetail.find({
      productPriceHeader_id: { $ne: null }, // Skip records without a linked ProductPriceHeader
    })
      .populate({
        path: "product_id",
        populate: [
          {
            path: "unit_id",
            model: "unit",
          },
          {
            path: "category_id",
            model: "category",
          },
        ],
      })
      .populate({
        path: "productPriceHeader_id",
        match: { status: "active" }, // Only include active ProductPriceHeader
      });

    // Filter out invalid records (remove those with a null productPriceHeader_id)
    const filteredProductPrices = productPrices.filter(
      (priceDetail) => priceDetail.productPriceHeader_id !== null
    );

    // Get all active PromotionHeader
    const activePromotionHeaders = await PromotionHeader.find({
      isActive: true,
    });

    // Get all active PromotionLine linked to active PromotionHeader
    const activePromotionLines = await PromotionLine.find({
      promotionHeader_id: {
        $in: activePromotionHeaders.map((header) => header._id),
      },
      isActive: true,
    });

    // Get all active PromotionDetail based on promotionLine_id
    const activePromotionDetails = await PromotionDetail.find({
      promotionLine_id: { $in: activePromotionLines.map((line) => line._id) },
    }).populate("product_id product_donate");

    // Create a list of products with their prices and promotions
    const productsList = filteredProductPrices.map((priceDetail) => {
      const product = priceDetail.product_id;
      let promotions = [];

      // Find promotions applicable to the current product
      activePromotionHeaders.forEach((promoHeader) => {
        activePromotionLines
          .filter((line) => line.promotionHeader_id.equals(promoHeader._id))
          .forEach((promoLine) => {
            activePromotionDetails
              .filter((detail) => detail.promotionLine_id.equals(promoLine._id))
              .forEach((promoDetail) => {
                if (
                  promoDetail.product_id &&
                  promoDetail.product_id.equals(product._id)
                ) {
                  promotions.push({
                    header: promoHeader.description,
                    line: promoLine.description,
                    type: promoLine.type,
                    startDate: promoLine.startDate,
                    endDate: promoLine.endDate,
                    percent: promoDetail.percent,
                    amount_sales: promoDetail.amount_sales,
                    product_donate: promoDetail.product_donate,
                    quantity_donate: promoDetail.quantity_donate,
                    product_id: promoDetail.product_id,
                    quantity: promoDetail.quantity,
                    amount_donate: promoDetail.amount_donate,
                    amount_limit: promoDetail.amount_limit,
                  });
                }
              });
          });
      });

      // Construct the product data
      return {
        _id: product._id,
        name: product.name,
        item_code: product.item_code,
        category_id: product.category_id._id,
        barcode: product.barcode,
        unit_id: product.unit_id,
        img: product.img,
        price: priceDetail.price,
        priceDetail: priceDetail,
        promotions: promotions,
      };
    });

    // Sort products by the number of promotions in descending order
    productsList.sort((a, b) => b.promotions.length - a.promotions.length);

    return productsList; // Return the list of products
  } catch (err) {
    throw new Error(
      `Error getting products with price and promotions: ${err.message}`
    );
  }
}


module.exports = {
  getAllCategory,
  addCategory,
  updateCategory,
  getAllProduct,
  getProductsBySupplierId,
  getProductsDetail,
  addProductWithWarehouse,
  updateProduct,
  getAllProductsWithPriceAndPromotion,
  getAllProductsWithPriceAndPromotionNoCategory
};
