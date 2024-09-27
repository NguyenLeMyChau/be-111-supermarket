const Category = require('../models/Category');
const Product = require('../models/Product');

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

async function getAllProduct() {
    try {
        const products = await Product.find();
        return products;
    } catch (err) {
        throw new Error(`Error getting all products: ${err.message}`);
    }
}

module.exports = {
    getAllCategory,
    getAllProduct
};