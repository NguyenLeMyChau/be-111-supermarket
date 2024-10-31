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
  const session = await mongoose.startSession(); // Nếu bạn đang sử dụng session cho transaction
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error("Product not found");
    }

    const { item_code, unit_convert } = productData;

    // Bước 1: Kiểm tra xem sản phẩm với cùng item_code và unit_id đã tồn tại chưa
    const existingProduct = await Product.findOne({ item_code }).session(session);

    if (
      existingProduct &&
      existingProduct._id.toString() !== productId.toString()
    ) {
      throw new Error("Sản phẩm với item_code này đã tồn tại.");
    }

    // Bước 2: Cập nhật thông tin sản phẩm
    product.set(productData);

    // Bước 3: Kiểm tra và cập nhật unit_id nếu checkBaseUnit là true
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
    const productPrices = await ProductPriceDetail.find({
      productPriceHeader_id: { $ne: null }, // Bỏ qua các bản ghi không có liên kết ProductPriceHeader
    }).populate({
      path: "productPriceHeader_id",
      match: { status: "active" }, // Chỉ lấy ProductPriceHeader có status là 'active'
    }).populate({
      path: 'unit_id'
    });;

    // Lọc ra các bản ghi hợp lệ (loại bỏ những bản ghi có productPriceHeader_id là null)
    const filteredProductPrices = productPrices.filter(
      (priceDetail) => priceDetail.productPriceHeader_id !== null
    );

    // Lấy tất cả PromotionHeader đang hoạt động
    const activePromotionHeaders = await PromotionHeader.find();

    // Lấy tất cả PromotionLine có liên kết với PromotionHeader đang hoạt động
    const activePromotionLines = await PromotionLine.find({
      promotionHeader_id: {
        $in: activePromotionHeaders.map((header) => header._id),
      },
      status: 'active',
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
          const promoLines = activePromotionLines.filter(line => line.promotionHeader_id.equals(promoHeader._id));

          for (const promoLine of promoLines) {
            const promoDetails = activePromotionDetails.filter(detail => detail.promotionLine_id.equals(promoLine._id));

            for (const promoDetail of promoDetails) {
              if ((promoDetail.product_id && promoDetail.product_id.equals(product._id))&&(promoDetail.unit_id && promoDetail.unit_id.equals(priceDetail.unit_id._id))||(promoDetail.product_donate && promoDetail.product_donate.equals(product._id))&&(promoDetail.unit_id_donate && promoDetail.unit_id_donate.equals(priceDetail.unit_id._id))) {
                promotions.push({
                  header: promoHeader.description,
                  line: promoLine.description,
                  type: promoLine.type,
                  startDate: promoLine.startDate,
                  endDate: promoLine.endDate,
                  percent: promoDetail.percent,
                  amount_sales: promoDetail.amount_sales,
                  product_donate: promoDetail.product_donate,
                  unit_id_donate:promoDetail.unit_id_donate,
                  quantity_donate: promoDetail.quantity_donate,
                  product_id: promoDetail.product_id,
                  unit_id:promoDetail.unit_id,
                  quantity: promoDetail.quantity,
                  amount_donate: promoDetail.amount_donate,
                  amount_limit: promoDetail.amount_limit,
                  description:promoDetail.description,
                  
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
          unit_convert:product.unit_convert,
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

async function getProductsByBarcodeInUnitConvert(barcode) {
  try {
    const products = await Product.find({ "unit_convert.barcode": barcode });
    return products;
  } catch (err) {
    throw new Error(`Error getting products by barcode in unit_convert: ${err.message}`);
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
  getAllProductsWithPriceAndPromotionNoCategory,
  getProductsByBarcodeInUnitConvert,
  getAllCategoryWithPrice
};
