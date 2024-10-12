const Category = require('../models/Category');
const Product = require('../models/Product');
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

        // Trả về đối tượng sản phẩm cùng với các giao dịch kho hàng
        return {
            ...product.toObject(),
            transactions: transactions
        };
    } catch (err) {
        throw new Error(`Error getting product detail: ${err.message}`);
    }
}

module.exports = {
    getAllCategory,
    addCategory,
    updateCategory,
    getAllProduct,
    getProductsBySupplierId,
    getProductsDetail,
};