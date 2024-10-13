const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const TransactionInventory = require('../models/TransactionInventory');

async function getAllCategory() {
    try {
        const categories = await Category.find();

        const categoriesWithProducts = await Promise.all(categories.map(async (category) => {
            const products = await Product.find({ category_id: category._id });
            return {
                ...category.toObject(),
                products: products,
            };
        }));

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
            throw new Error('Category not found');
        }

        category.set(categoryData);
        await category.save();
        return category;
    }
    catch (err) {
        throw new Error(`Error removing category: ${err.message}`);
    }
}

async function getAllProduct() {
    try {
        const products = await Product.find();
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
            .populate('unit_id', 'name')
            .populate('supplier_id', 'name phone email')
            .populate('category_id', 'name');

        if (!product) {
            throw new Error('Product not found');
        }

        // Tìm các giao dịch kho hàng có product_id tương ứng
        const transactions = await TransactionInventory.find({ product_id: productId });

        const productObject = product.toObject();

        // Tìm các kho hàng có product_id tương ứng
        const warehouses = await Warehouse.findOne({ item_code: productObject.item_code });

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
    const session = await mongoose.startSession();  // Bắt đầu session
    session.startTransaction();  // Bắt đầu transaction

    try {
        // Bước 1: Tạo sản phẩm và lưu vào CSDL với session
        const product = new Product(productData);
        await product.save({ session });

        // Bước 2: Kiểm tra item_code từ productData và tạo Warehouse mới
        const { item_code } = productData;

        if (item_code) {
            // Kiểm tra xem Warehouse với item_code này đã tồn tại chưa
            const existingWarehouse = await Warehouse.findOne({ item_code }).session(session);

            if (!existingWarehouse) {
                // Nếu chưa có, tạo Warehouse mới với item_code
                const newWarehouse = new Warehouse({
                    item_code,
                    stock_quantity: 0,
                    min_stock_threshold: productData.min_stock_threshold,
                });

                await newWarehouse.save({ session });
                console.log('New warehouse created:', newWarehouse);
            } else {
                console.log('Warehouse with this item_code already exists.');
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
        throw new Error(`Error adding product and creating warehouse: ${err.message}`);
    }
};


module.exports = {
    getAllCategory,
    addCategory,
    updateCategory,
    getAllProduct,
    getProductsBySupplierId,
    getProductsDetail,
    addProductWithWarehouse,
};